import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Project } from '../models/Project';
import { authenticate } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { fetchVideoMetadata, isValidYouTubeUrl } from '../services/youtube/downloader';
import { sttProvider, llmProvider } from '../services/ai';
import { downloadVideo } from '../services/youtube/downloader';
import { extractAudio, getVideoInfo } from '../services/ffmpeg/processor';
import { env } from '../config/env';
import { storagePath } from '../config/storage';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// This build has no accounts. Every request is treated as authenticated
// (see middleware/auth.ts). Projects are scoped to one stable owner id.
const OWNER_ID = 'clipforge-owner';

// ── Upload storage ─────────────────────────────────────────────
const uploadDir = path.join(storagePath, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowedExt = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    const ok = file.mimetype.startsWith('video/') || allowedExt.includes(ext);
    if (ok) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Use MP4, MOV, AVI, MKV or WebM.'));
    }
  },
});

// GET /api/projects — List owner projects
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Project.find({ userId: OWNER_ID })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-videoPath -audioPath -clips.transcript'),
      Project.countDocuments({ userId: OWNER_ID }),
    ]);

    res.json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        hasMore: skip + items.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: OWNER_ID,
    }).select('-videoPath -audioPath');

    if (!project) return next(createError('Project not found', 404));

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/metadata — Fetch video metadata without downloading
router.post('/metadata', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body;

    if (!url || !isValidYouTubeUrl(url)) {
      return next(createError('Valid YouTube URL required', 422));
    }

    const metadata = await fetchVideoMetadata(url);

    res.json({
      success: true,
      data: {
        id: metadata.id,
        title: metadata.title,
        description: metadata.description?.substring(0, 500),
        duration: metadata.duration,
        uploader: metadata.uploader,
        uploadDate: metadata.upload_date,
        viewCount: metadata.view_count,
        likeCount: metadata.like_count,
        thumbnailUrl: metadata.thumbnail,
        language: metadata.language,
        isLiveContent: metadata.is_live,
      },
    });
  } catch (err: any) {
    next(createError(err.message, 400));
  }
});

// POST /api/projects — Create project from a YouTube URL + start analysis pipeline
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, rightsConfirmed, rightsType, rightsSafeMode, sourceType } = req.body;

    if (!rightsConfirmed) {
      return next(createError('You must confirm you have the rights to process this content', 403));
    }

    if (!rightsType) {
      return next(createError('Rights type is required', 422));
    }

    // Rights-Safe Mode: fair-use claims are excluded from the safe workflow
    if (rightsSafeMode === true && rightsType === 'FAIR_USE_CLAIM') {
      return next(
        createError('Rights-Safe Mode does not allow Fair Use claims. Choose another rights type or disable Rights-Safe Mode.', 422)
      );
    }

    // Validate YouTube URL for youtube source type
    if (sourceType === 'upload') {
      return next(createError('Upload a video via POST /api/projects/upload', 422));
    }
    if (!url || !isValidYouTubeUrl(url)) {
      return next(createError('Valid YouTube URL required', 422));
    }

    // Create project in PENDING state
    const project = await Project.create({
      userId: OWNER_ID,
      sourceUrl: url,
      sourceType: 'youtube',
      rightsConfirmed: true,
      rightsType,
      rightsTimestamp: new Date(),
      rightsSafeMode: rightsSafeMode || false,
      status: 'PENDING',
    });

    res.status(201).json({ success: true, data: project });

    // Run analysis pipeline asynchronously
    runAnalysisPipeline(project._id.toString(), url, 'youtube').catch((err) => {
      console.error('Pipeline error:', err);
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/upload — Rights-safe flow: upload your own video, then analyze
router.post('/upload', (req: Request, res: Response, next: NextFunction) => {
  upload.single('video')(req, res, (err) => {
    if (err) return next(createError(err.message || 'Upload failed', 422));
    if (!req.file) return next(createError('Video file is required (field name: video)', 422));
    next();
  });
}, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rightsConfirmed, rightsType, rightsSafeMode } = req.body;
    const confirmed = rightsConfirmed === true || rightsConfirmed === 'true';
    const safeMode = rightsSafeMode === true || rightsSafeMode === 'true';

    if (!confirmed) {
      fs.unlink(req.file!.path, () => undefined);
      return next(createError('You must confirm you have the rights to process this content', 403));
    }
    if (!rightsType) {
      fs.unlink(req.file!.path, () => undefined);
      return next(createError('Rights type is required', 422));
    }
    if (safeMode && rightsType === 'FAIR_USE_CLAIM') {
      fs.unlink(req.file!.path, () => undefined);
      return next(
        createError('Rights-Safe Mode does not allow Fair Use claims. Choose another rights type or disable Rights-Safe Mode.', 422)
      );
    }

    const project = await Project.create({
      userId: OWNER_ID,
      sourceUrl: 'user-upload',
      sourceType: 'upload',
      videoPath: req.file!.path,
      rightsConfirmed: true,
      rightsType,
      rightsTimestamp: new Date(),
      rightsSafeMode: safeMode,
      status: 'PENDING',
      videoMetadata: {
        title: path.basename(req.file!.originalname, path.extname(req.file!.originalname)),
        description: '',
        duration: 0,
        uploader: 'clipforge-user',
      },
    });

    res.status(201).json({ success: true, data: project });

    runAnalysisPipeline(project._id.toString(), undefined, 'upload', req.file!.path).catch((err) => {
      console.error('Pipeline error:', err);
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: OWNER_ID,
    });

    if (!project) return next(createError('Project not found', 404));

    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

async function runAnalysisPipeline(
  projectId: string,
  url?: string,
  sourceType: string = 'youtube',
  uploadedVideoPath?: string
) {
  try {
    // Step 1: Fetch metadata
    await Project.findByIdAndUpdate(projectId, { status: 'DOWNLOADING' });

    let videoPath: string;
    let audioPath: string;
    let videoMetadata: any;

    if (sourceType === 'upload' && uploadedVideoPath) {
      if (!fs.existsSync(uploadedVideoPath)) {
        throw new Error('Uploaded video file not found. Please upload it again.');
      }
      videoPath = uploadedVideoPath;

      // Extract a WAV for speech-to-text and probe the real duration
      const audioDir = path.join(storagePath, 'audio', projectId);
      fs.mkdirSync(audioDir, { recursive: true });
      audioPath = path.join(audioDir, 'audio.wav');
      await Project.findByIdAndUpdate(projectId, {
        statusMessage: 'Extracting audio from your video...',
      });
      await extractAudio(uploadedVideoPath, audioPath);

      let duration = 0;
      try {
        duration = Math.round((await getVideoInfo(videoPath)).duration);
      } catch {
        // ffprobe failure is non-fatal — the mock STT provider works regardless
      }

      const existing = await Project.findById(projectId);
      videoMetadata = {
        title: existing?.videoMetadata?.title || 'Uploaded Video',
        description: '',
        duration: duration || 300,
        uploader: existing?.videoMetadata?.uploader,
      };
    } else {
      if (!url) throw new Error('YouTube URL is required for this source type');

      // Fetch metadata first
      const meta = await fetchVideoMetadata(url);
      videoMetadata = {
        title: meta.title,
        description: meta.description,
        duration: meta.duration,
        uploader: meta.uploader,
        uploadDate: meta.upload_date,
        viewCount: meta.view_count,
        likeCount: meta.like_count,
        thumbnailUrl: meta.thumbnail,
        language: meta.language,
        isLiveContent: meta.is_live,
      };

      // Download video
      const paths = await downloadVideo(url, projectId, (p) => {
        Project.findByIdAndUpdate(projectId, {
          statusMessage: `Downloading: ${p}%`,
        }).exec();
      });
      videoPath = paths.videoPath;
      audioPath = paths.audioPath;
    }

    await Project.findByIdAndUpdate(projectId, {
      status: 'ANALYZING',
      videoPath,
      audioPath,
      videoMetadata,
      statusMessage: 'Running speech-to-text...',
    });

    // Step 2: Transcribe
    const sttResult = await sttProvider.transcribe(audioPath);

    await Project.findByIdAndUpdate(projectId, {
      statusMessage: 'Analyzing for engaging moments...',
    });

    // Step 3: LLM analysis
    const llmResult = await llmProvider.analyzeClips({
      transcript: sttResult.segments,
      fullText: sttResult.fullText,
      videoMetadata: {
        title: videoMetadata.title || 'Unknown',
        description: videoMetadata.description || '',
        duration: videoMetadata.duration || sttResult.duration || 300,
        uploader: videoMetadata.uploader,
      },
    });

    // Step 4: Build clip candidates
    const clips = llmResult.clips.map((clip) => ({
      id: uuidv4(),
      title: clip.title,
      startTime: clip.startTime,
      endTime: clip.endTime,
      duration: clip.duration,
      transcript: clip.transcriptSlice,
      fullText: clip.transcriptSlice.map((s) => s.text).join(' '),
      hook: clip.hook,
      reason: clip.reason,
      engagementScore: clip.engagementScore,
      topics: clip.topics,
      emotions: clip.emotions,
    }));

    await Project.findByIdAndUpdate(projectId, {
      status: 'READY',
      clips,
      statusMessage: null,
    });
  } catch (err: any) {
    await Project.findByIdAndUpdate(projectId, {
      status: 'ERROR',
      statusMessage: err.message,
    });
  }
}

export { router as projectsRouter };
