import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, renderSchema } from '../middleware/validate';
import { createError } from '../middleware/errorHandler';
import { RenderJob } from '../models/RenderJob';
import { Project } from '../models/Project';
import { jobQueue } from '../services/jobs/queue';

const router = Router();

// This build has no accounts. Every request is treated as authenticated
// (see middleware/auth.ts). Render jobs are scoped to one stable owner id.
const OWNER_ID = 'clipforge-owner';

/** A job is visible only to the stable owner id of this build. */
async function jobBelongsToUser(projectId: unknown): Promise<boolean> {
  const project = await Project.findOne({ _id: projectId, userId: OWNER_ID }).select('_id');
  return Boolean(project);
}

// POST /api/render — Start a render job
router.post('/', authenticate, validate(renderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, clipId, editorConfig } = req.body;

    // Verify project belongs to owner
    const project = await Project.findOne({
      _id: projectId,
      userId: OWNER_ID,
    });

    if (!project) return next(createError('Project not found', 404));
    if (project.status !== 'READY') {
      return next(createError('Project is not ready for rendering', 400));
    }

    const clip = project.clips.find((c) => c.id === clipId);
    if (!clip) return next(createError('Clip not found', 404));

    const jobId = await jobQueue.enqueue({ projectId, clipId, editorConfig });

    res.status(202).json({
      success: true,
      data: { jobId, status: 'QUEUED' },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/render/:jobId — Get job status
router.get('/:jobId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await RenderJob.findById(req.params.jobId);
    if (!job) return next(createError('Job not found', 404));
    if (!(await jobBelongsToUser(job.projectId))) {
      return next(createError('Job not found', 404));
    }

    res.json({
      success: true,
      data: {
        id: job._id,
        status: job.status,
        progress: job.progress,
        stage: job.stage,
        error: job.error,
        downloadUrl: job.status === 'COMPLETED' ? `/api/export/${job._id}/download` : undefined,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/render/:jobId/progress — SSE progress stream
router.get('/:jobId/progress', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;

  try {
    const job = await RenderJob.findById(jobId);
    if (!job || !(await jobBelongsToUser(job.projectId))) {
      return next(createError('Job not found', 404));
    }
  } catch (err) {
    return next(err);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial heartbeat
  sendEvent({ type: 'connected', jobId });

  // Subscribe to job updates
  const unsubscribe = jobQueue.subscribe(jobId, (event) => {
    sendEvent({ type: 'progress', ...event });

    if (event.status === 'COMPLETED' || event.status === 'FAILED') {
      res.end();
      unsubscribe();
    }
  });

  // Also poll DB for current state in case job already completed
  RenderJob.findById(jobId).then((job) => {
    if (job && (job.status === 'COMPLETED' || job.status === 'FAILED')) {
      sendEvent({
        type: 'progress',
        jobId,
        status: job.status,
        progress: job.progress,
        downloadUrl: job.status === 'COMPLETED' ? `/api/export/${jobId}/download` : undefined,
        error: job.error,
      });
      res.end();
      unsubscribe();
    }
  });

  // Cleanup on client disconnect
  req.on('close', () => {
    unsubscribe();
  });
});

export { router as renderRouter };
