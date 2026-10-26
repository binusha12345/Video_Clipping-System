// ============================================================
// FFmpeg Processor
// All video processing operations using ffmpeg-static (bundled)
// ============================================================
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffprobeStatic = require('ffprobe-static') as { path: string };
import path from 'path';
import fs from 'fs';
import { logger } from '../../utils/logger';

// Use bundled ffmpeg binary
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
  logger.info(`[FFmpeg] Using bundled binary: ${ffmpegStatic}`);
}

if (ffprobeStatic?.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  audioCodec?: string;
  bitrate?: number;
}

export interface TrimOptions {
  inputPath: string;
  outputPath: string;
  startTime: number;   // seconds
  endTime: number;     // seconds
  onProgress?: (percent: number) => void;
}

export interface RenderOptions {
  inputPath: string;
  outputPath: string;
  startTime: number;
  endTime: number;
  subtitlePath?: string;
  musicPath?: string;
  musicVolume?: number;
  voiceVolume?: number;
  ttsAudioPath?: string;
  watermarkText?: string;
  watermarkImagePath?: string;
  watermarkPosition?: string;
  watermarkOpacity?: number;
  onProgress?: (percent: number) => void;
}

/**
 * Get video metadata using ffprobe
 */
export function getVideoInfo(filePath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

      if (!videoStream) return reject(new Error('No video stream found'));

      const fpsStr = videoStream.r_frame_rate || videoStream.avg_frame_rate || '30/1';
      const [num, den] = fpsStr.split('/').map(Number);
      const fps = den ? num / den : 30;

      resolve({
        duration: Number(metadata.format.duration) || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps: Math.round(fps),
        codec: videoStream.codec_name || 'unknown',
        audioCodec: audioStream?.codec_name,
        bitrate: Number(metadata.format.bit_rate) || undefined,
      });
    });
  });
}

/**
 * Extract the audio track of a video into a 16-bit / 44.1kHz WAV file
 * (the format speech-to-text providers expect).
 */
export function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    ffmpeg(inputPath)
      .noVideo()
      .outputOptions(['-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`Audio extraction failed: ${err.message}`)))
      .run();
  });
}

/**
 * Trim a video segment from startTime to endTime
 */
export function trimVideo(opts: TrimOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const duration = opts.endTime - opts.startTime;
    fs.mkdirSync(path.dirname(opts.outputPath), { recursive: true });

    ffmpeg(opts.inputPath)
      .seekInput(opts.startTime)
      .duration(duration)
      .outputOptions(['-c:v copy', '-c:a copy'])
      .output(opts.outputPath)
      .on('progress', (p) => opts.onProgress?.(Math.round(p.percent || 0)))
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`Trim failed: ${err.message}`)))
      .run();
  });
}

/**
 * Convert a video to 9:16 vertical format (1080x1920)
 * Crops center and pads with blurred background
 */
export function convertToVertical(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Complex filter: blur-padded background + center crop overlay
    const filter = [
      // Background: scale to fill height, blur heavily
      '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:20[bg]',
      // Foreground: scale to fit width (1080), keep aspect
      '[0:v]scale=1080:-2[fg]',
      // Overlay fg centered on bg
      '[bg][fg]overlay=(W-w)/2:(H-h)/2[out]',
    ].join(';');

    ffmpeg(inputPath)
      .complexFilter(filter, 'out')
      .outputOptions([
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-r 30',
        '-pix_fmt yuv420p',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`Vertical conversion failed: ${err.message}`)))
      .run();
  });
}

/**
 * Full render pipeline: trim + vertical format + subtitles + music + watermark
 */
export async function renderClip(opts: RenderOptions): Promise<void> {
  const duration = Math.max(1, opts.endTime - opts.startTime);
  fs.mkdirSync(path.dirname(opts.outputPath), { recursive: true });

  // Check if input video has an audio stream
  let hasAudio = false;
  try {
    const info = await getVideoInfo(opts.inputPath);
    hasAudio = Boolean(info.audioCodec);
  } catch (probeErr: any) {
    logger.warn('[FFmpeg] Probe failed, assuming audio present:', probeErr.message || probeErr);
    hasAudio = true;
  }

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(opts.inputPath)
      .seekInput(opts.startTime)
      .duration(duration);

    // Add music track if provided
    if (opts.musicPath && fs.existsSync(opts.musicPath)) {
      cmd = cmd.addInput(opts.musicPath);
    }

    // Add TTS audio if provided
    if (opts.ttsAudioPath && fs.existsSync(opts.ttsAudioPath)) {
      cmd = cmd.addInput(opts.ttsAudioPath);
    }

    const filterParts: string[] = [];
    const musicVol = opts.musicVolume ?? 0.3;
    const voiceVol = opts.voiceVolume ?? 1.0;

    // Video processing: vertical conversion
    filterParts.push(
      '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:20[bg]',
      '[0:v]scale=1080:-2[fg]',
      '[bg][fg]overlay=(W-w)/2:(H-h)/2[video_out]'
    );

    let videoLabel = 'video_out';

    // Burn subtitles if provided
    if (opts.subtitlePath && fs.existsSync(opts.subtitlePath)) {
      const escapedPath = opts.subtitlePath
        .replace(/\\/g, '/')
        .replace(/:/g, '\\:')
        .replace(/'/g, "\\'")
        .replace(/ /g, '\\ ');
      filterParts.push(`[${videoLabel}]subtitles=filename='${escapedPath}'[video_sub]`);
      videoLabel = 'video_sub';
    }

    // Watermark text
    if (opts.watermarkText) {
      const pos = getWatermarkPosition(opts.watermarkPosition || 'bottom-right');
      const opacity = opts.watermarkOpacity ?? 0.8;
      const safeText = opts.watermarkText.replace(/'/g, "\\'").replace(/:/g, '\\:');
      filterParts.push(
        `[${videoLabel}]drawtext=text='${safeText}':fontsize=32:fontcolor=white@${opacity}:x=${pos.x}:y=${pos.y}:shadowcolor=black:shadowx=2:shadowy=2[video_wm]`
      );
      videoLabel = 'video_wm';
    }

    // Audio filter mixing
    const mixLabels: string[] = [];

    if (hasAudio) {
      filterParts.push(`[0:a]volume=${voiceVol}[va]`);
      mixLabels.push('[va]');
    } else {
      filterParts.push(`anullsrc=r=44100:cl=stereo[va]`);
      mixLabels.push('[va]');
    }

    if (opts.musicPath && fs.existsSync(opts.musicPath)) {
      filterParts.push(`[1:a]volume=${musicVol}[ma]`);
      mixLabels.push('[ma]');
    }

    if (mixLabels.length > 1) {
      filterParts.push(`${mixLabels.join('')}amix=inputs=${mixLabels.length}:duration=first[audio_out]`);
    } else {
      filterParts.push(`[va]aresample=44100[audio_out]`);
    }

    const complexFilter = filterParts.join(';');

    const outputOpts: string[] = [
      '-map', `[${videoLabel}]`,
      '-map', '[audio_out]',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-r', '30',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
    ];

    cmd
      .complexFilter(complexFilter)
      .outputOptions(outputOpts)
      .output(opts.outputPath)
      .on('progress', (p) => opts.onProgress?.(Math.round(p.percent || 0)))
      .on('end', () => {
        logger.info(`[FFmpeg] Render complete: ${opts.outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        logger.error('[FFmpeg] Render error:', err.message);
        reject(new Error(`Render failed: ${err.message}`));
      })
      .run();
  });
}

function getWatermarkPosition(position: string): { x: string; y: string } {
  const padding = '20';
  switch (position) {
    case 'top-left': return { x: padding, y: padding };
    case 'top-right': return { x: `w-tw-${padding}`, y: padding };
    case 'bottom-left': return { x: padding, y: `h-th-${padding}` };
    case 'bottom-right': return { x: `w-tw-${padding}`, y: `h-th-${padding}` };
    case 'center': return { x: '(w-tw)/2', y: '(h-th)/2' };
    default: return { x: `w-tw-${padding}`, y: `h-th-${padding}` };
  }
}
