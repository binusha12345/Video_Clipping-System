// ============================================================
// In-Memory Job Queue with SSE Progress Broadcasting
// Processes render jobs sequentially with retry logic
// ============================================================
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { RenderJob, IEditorConfig } from '../../models/RenderJob';
import { logger } from '../../utils/logger';

export interface JobProgressEvent {
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  stage?: string;
  error?: string;
  downloadUrl?: string;
}

type JobHandler = (
  jobId: string,
  projectId: string,
  clipId: string,
  editorConfig: IEditorConfig,
  onProgress: (progress: number, stage: string) => void
) => Promise<string>;

class JobQueue extends EventEmitter {
  private queue: Array<{
    jobId: string;
    projectId: string;
    clipId: string;
    editorConfig: IEditorConfig;
    retries: number;
  }> = [];

  private running = false;
  private handlers = new Map<string, JobHandler>();
  private sseClients = new Map<string, Set<(data: JobProgressEvent) => void>>();
  private MAX_RETRIES = 3;

  registerHandler(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  async enqueue(params: {
    projectId: string;
    clipId: string;
    editorConfig: IEditorConfig;
  }): Promise<string> {
    const jobId = uuidv4();

    // Persist to DB
    await RenderJob.create({
      _id: jobId,
      projectId: params.projectId,
      clipId: params.clipId,
      type: 'RENDER',
      status: 'QUEUED',
      progress: 0,
      editorConfig: params.editorConfig,
      retries: 0,
    });

    this.queue.push({ jobId, ...params, retries: 0 });
    this.emit('job:queued', jobId);

    logger.info(`[Queue] Job ${jobId} enqueued. Queue size: ${this.queue.length}`);

    if (!this.running) {
      this.processNext();
    }

    return jobId;
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.running = false;
      return;
    }

    this.running = true;
    const job = this.queue.shift()!;
    const handler = this.handlers.get('RENDER');

    if (!handler) {
      logger.error('[Queue] No RENDER handler registered');
      this.running = false;
      return;
    }

    await RenderJob.findByIdAndUpdate(job.jobId, {
      status: 'PROCESSING',
      progress: 0,
    });

    this.broadcast(job.jobId, {
      jobId: job.jobId,
      status: 'PROCESSING',
      progress: 0,
      stage: 'Starting render...',
    });

    try {
      const onProgress = (progress: number, stage: string) => {
        // Update DB asynchronously
        RenderJob.findByIdAndUpdate(job.jobId, { progress, stage }).exec();
        this.broadcast(job.jobId, {
          jobId: job.jobId,
          status: 'PROCESSING',
          progress,
          stage,
        });
      };

      const outputPath = await handler(
        job.jobId,
        job.projectId,
        job.clipId,
        job.editorConfig,
        onProgress
      );

      const downloadUrl = `/api/export/${job.jobId}/download`;

      await RenderJob.findByIdAndUpdate(job.jobId, {
        status: 'COMPLETED',
        progress: 100,
        outputPath,
        stage: 'Complete',
      });

      this.broadcast(job.jobId, {
        jobId: job.jobId,
        status: 'COMPLETED',
        progress: 100,
        stage: 'Complete',
        downloadUrl,
      });

      logger.info(`[Queue] Job ${job.jobId} completed`);
    } catch (err: any) {
      logger.error(`[Queue] Job ${job.jobId} failed:`, err.message);

      if (job.retries < this.MAX_RETRIES) {
        job.retries++;
        this.queue.unshift(job); // Retry immediately (at front)
        await RenderJob.findByIdAndUpdate(job.jobId, {
          status: 'QUEUED',
          retries: job.retries,
        });
        logger.info(`[Queue] Retrying job ${job.jobId} (attempt ${job.retries})`);
      } else {
        await RenderJob.findByIdAndUpdate(job.jobId, {
          status: 'FAILED',
          error: err.message,
        });

        this.broadcast(job.jobId, {
          jobId: job.jobId,
          status: 'FAILED',
          progress: 0,
          error: err.message,
        });
      }
    }

    // Schedule next job
    setImmediate(() => this.processNext());
  }

  /**
   * Subscribe to SSE events for a job
   */
  subscribe(jobId: string, callback: (data: JobProgressEvent) => void): () => void {
    if (!this.sseClients.has(jobId)) {
      this.sseClients.set(jobId, new Set());
    }
    this.sseClients.get(jobId)!.add(callback);

    return () => {
      this.sseClients.get(jobId)?.delete(callback);
    };
  }

  private broadcast(jobId: string, event: JobProgressEvent) {
    this.sseClients.get(jobId)?.forEach((cb) => {
      try { cb(event); } catch {}
    });
  }
}

export const jobQueue = new JobQueue();
