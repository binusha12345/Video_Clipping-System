// ============================================================
// Render Worker
// Registered as the RENDER handler in the job queue
// Orchestrates the full video processing pipeline
// ============================================================
import path from 'path';
import fs from 'fs';
import { jobQueue } from './queue';
import { IEditorConfig } from '../../models/RenderJob';
import { Project } from '../../models/Project';
import { renderClip } from '../ffmpeg/processor';
import { generateASSSubtitles } from '../ffmpeg/subtitles';
import { storagePath } from '../../config/storage';
import { logger } from '../../utils/logger';

// Music library CC0 tracks (bundled/generated into local storage)
const MUSIC_LIBRARY_PATH = path.join(storagePath, 'music');

export function registerRenderWorker() {
  jobQueue.registerHandler(
    'RENDER',
    async (
      jobId: string,
      projectId: string,
      clipId: string,
      editorConfig: IEditorConfig,
      onProgress: (p: number, stage: string) => void
    ): Promise<string> => {
      onProgress(5, 'Loading project...');

      const project = await Project.findById(projectId);
      if (!project) throw new Error(`Project ${projectId} not found`);

      const clip = project.clips.find((c) => c.id === clipId);
      if (!clip) throw new Error(`Clip ${clipId} not found in project`);

      if (!project.videoPath || !fs.existsSync(project.videoPath)) {
        throw new Error('Source video file not found. Please re-analyze the project.');
      }

      onProgress(10, 'Generating subtitles...');

      // Output paths
      const outputDir = path.join(storagePath, 'renders', projectId);
      fs.mkdirSync(outputDir, { recursive: true });

      const outputPath = path.join(outputDir, `${clipId}_${Date.now()}.mp4`);
      let subtitlePath: string | undefined;

      // Generate subtitles if enabled
      if (editorConfig.subtitles && clip.transcript?.length) {
        subtitlePath = path.join(outputDir, `${clipId}_subs.ass`);
        generateASSSubtitles(
          clip.transcript,
          clip.startTime,
          subtitlePath,
          editorConfig.subtitleStyle as any
        );
      }

      onProgress(20, 'Processing video...');

      // Music track path
      let musicPath: string | undefined;
      if (editorConfig.musicTrackId) {
        const candidates = ['.mp3', '.wav', '.m4a', '.ogg'].map((ext) =>
          path.join(MUSIC_LIBRARY_PATH, `${editorConfig.musicTrackId}${ext}`)
        );
        musicPath = candidates.find((p) => fs.existsSync(p));
        if (!musicPath) {
          logger.warn(`[Worker] Music track ${editorConfig.musicTrackId} not found in ${MUSIC_LIBRARY_PATH}`);
        }
      }

      // Trim adjust
      const start = clip.startTime + (editorConfig.trimStart || 0);
      const end = clip.endTime - (editorConfig.trimEnd || 0);

      onProgress(30, 'Rendering clip...');

      await renderClip({
        inputPath: project.videoPath,
        outputPath,
        startTime: start,
        endTime: end,
        subtitlePath,
        musicPath,
        musicVolume: editorConfig.musicVolume ?? 0.3,
        voiceVolume: editorConfig.voiceVolume ?? 1.0,
        watermarkText: editorConfig.watermark?.enabled ? editorConfig.watermark.text : undefined,
        watermarkPosition: editorConfig.watermark?.position,
        watermarkOpacity: editorConfig.watermark?.opacity,
        onProgress: (p) => onProgress(30 + Math.round(p * 0.65), 'Encoding...'),
      });

      onProgress(95, 'Finalizing...');
      logger.info(`[Worker] Render complete: ${outputPath}`);

      return outputPath;
    }
  );

  logger.info('[Worker] Render worker registered');
}
