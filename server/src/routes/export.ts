import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';

const OWNER_ID = 'clipforge-owner';
import { createError } from '../middleware/errorHandler';
import { RenderJob } from '../models/RenderJob';
import { Project } from '../models/Project';
import { storagePath } from '../config/storage';

const router = Router();

// GET /api/export/:jobId/download — Download rendered MP4
router.get('/:jobId/download', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await RenderJob.findById(req.params.jobId);
    if (!job) return next(createError('Job not found', 404));

    const project = await Project.findOne({ _id: job.projectId, userId: OWNER_ID }).select('_id');
    if (!project) return next(createError('Job not found', 404));

    if (job.status !== 'COMPLETED') {
      return next(createError('Render not yet complete', 400));
    }

    if (!job.outputPath || !fs.existsSync(job.outputPath)) {
      return next(createError('Output file not found', 404));
    }

    const fileName = `clipforge_${job.clipId}_${Date.now()}.mp4`;
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const stat = fs.statSync(job.outputPath);
    res.setHeader('Content-Length', stat.size);

    const stream = fs.createReadStream(job.outputPath);
    stream.pipe(res);

    stream.on('error', () => {
      next(createError('Failed to stream file', 500));
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/export/music — List royalty-free music tracks
router.get('/music/library', authenticate, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getMusicLibrary(),
  });
});

/** Only list tracks whose audio files actually exist on disk. */
function getMusicLibrary() {
  const musicDir = path.join(storagePath, 'music');
  return MUSIC_TRACKS.filter((track) =>
    ['.mp3', '.wav', '.m4a', '.ogg'].some((ext) =>
      fs.existsSync(path.join(musicDir, `${track.id}${ext}`))
    )
  );
}

const MUSIC_TRACKS = [
    {
      id: 'upbeat-corporate-01',
      title: 'Upbeat Corporate',
      artist: 'CC0 Music',
      duration: 60,
      license: 'CC0',
      genre: 'Corporate',
      bpm: 128,
      description: 'Clean, professional background music suitable for tutorials and presentations.',
    },
    {
      id: 'ambient-chill-01',
      title: 'Ambient Chill',
      artist: 'CC0 Music',
      duration: 60,
      license: 'CC0',
      genre: 'Ambient',
      bpm: 90,
      description: 'Relaxed, atmospheric background music perfect for lifestyle content.',
    },
    {
      id: 'energetic-pop-01',
      title: 'Energetic Pop',
      artist: 'CC0 Music',
      duration: 60,
      license: 'CC0',
      genre: 'Pop',
      bpm: 140,
      description: 'High-energy pop beat ideal for highlights and montages.',
    },
    {
      id: 'lo-fi-beats-01',
      title: 'Lo-Fi Study Beats',
      artist: 'CC0 Music',
      duration: 60,
      license: 'CC0',
      genre: 'Lo-Fi',
      bpm: 85,
      description: 'Mellow lo-fi hip hop beats for a relaxed, focused atmosphere.',
    },
    {
      id: 'cinematic-inspire-01',
      title: 'Cinematic Inspire',
      artist: 'CC0 Music',
      duration: 60,
      license: 'CC0',
      genre: 'Cinematic',
      bpm: 110,
      description: 'Epic, motivational cinematic music for storytelling content.',
    },
    {
      id: 'electronic-future-01',
      title: 'Electronic Future',
      artist: 'CC0 Music',
      duration: 60,
      license: 'CC0',
      genre: 'Electronic',
      bpm: 132,
      description: 'Modern electronic beats perfect for tech and gaming content.',
    },
  ];

export { router as exportRouter };
