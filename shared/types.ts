// ============================================================
// ClipForge AI — Shared Types
// Used by both client (React) and server (Express/TypeScript)
// ============================================================

export type RightsType =
  | 'OWNER'
  | 'LICENSED'
  | 'CREATIVE_COMMONS'
  | 'PUBLIC_DOMAIN'
  | 'FAIR_USE_CLAIM';

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ProjectStatus =
  | 'PENDING'
  | 'DOWNLOADING'
  | 'ANALYZING'
  | 'READY'
  | 'ERROR';

export type ClipDuration = 30 | 60 | 120;

export type SubtitleAnimation =
  | 'none'
  | 'fade-in'
  | 'slide-up'
  | 'typewriter'
  | 'bounce';

export type SubtitlePosition = 'top' | 'middle' | 'bottom';

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;         // hex
  outlineColor: string;  // hex
  outlineWidth: number;
  bold: boolean;
  italic: boolean;
  position: SubtitlePosition;
  animation: SubtitleAnimation;
  backgroundColor?: string;
  backgroundOpacity?: number;
}

export interface TranscriptSegment {
  start: number;  // seconds
  end: number;    // seconds
  text: string;
  confidence?: number;
  speaker?: string;
}

export interface ClipCandidate {
  id: string;
  title: string;
  startTime: number;      // seconds
  endTime: number;        // seconds
  duration: ClipDuration;
  transcript: TranscriptSegment[];
  fullText: string;
  hook: string;           // Opening hook text
  reason: string;         // Why AI selected this clip
  engagementScore: number; // 0–100
  topics: string[];
  emotions: string[];
  thumbnailUrl?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;  // seconds
  license: 'CC0' | 'PUBLIC_DOMAIN' | 'ROYALTY_FREE';
  genre: string;
  bpm?: number;
  filePath: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  text?: string;
  imageUrl?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;  // 0–1
  scale?: number;   // relative size
}

export interface EditorConfig {
  trimStart: number;      // seconds (relative to clip start)
  trimEnd: number;        // seconds (relative to clip start)
  subtitles: boolean;
  subtitleStyle: SubtitleStyle;
  musicTrackId?: string;
  musicVolume: number;    // 0–1
  voiceVolume: number;    // 0–1
  aiCommentary: boolean;
  aiCommentaryText?: string;
  aiVoiceId?: string;
  watermark: WatermarkConfig;
  outputFormat: '9:16';
}

export interface VideoMetadata {
  title: string;
  description: string;
  duration: number;  // seconds
  uploader?: string;
  uploadDate?: string;
  viewCount?: number;
  likeCount?: number;
  thumbnailUrl?: string;
  language?: string;
  isLiveContent?: boolean;
}

export interface Project {
  id: string;
  /**
   * Kept for forward compatibility with the server schema.
   * This build has no accounts, so userId is informational only.
   */
  userId: string;
  sourceUrl: string;
  sourceType: 'youtube' | 'upload';
  videoMetadata?: VideoMetadata;
  rightsConfirmed: boolean;
  rightsType?: RightsType;
  rightsTimestamp?: string;
  rightsSafeMode: boolean;
  status: ProjectStatus;
  clips: ClipCandidate[];
  createdAt: string;
  updatedAt: string;
}

export interface RenderJob {
  id: string;
  clipId: string;
  projectId: string;
  status: JobStatus;
  progress: number;   // 0–100
  outputPath?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  editorConfig: EditorConfig;
}

/** This build has no accounts; the User shape is kept only for forward compat. */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

/** @deprecated this build has no accounts */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// AI Provider types
export type AIProvider = 'mock' | 'openai' | 'assemblyai' | 'elevenlabs' | 'deepgram';

export interface AIProviderConfig {
  stt: AIProvider;
  llm: AIProvider;
  tts: AIProvider;
}

// Job SSE event
export interface JobProgressEvent {
  jobId: string;
  status: JobStatus;
  progress: number;
  stage?: string;
  error?: string;
  downloadUrl?: string;
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: 'Inter',
  fontSize: 42,
  color: '#FFFFFF',
  outlineColor: '#000000',
  outlineWidth: 2,
  bold: true,
  italic: false,
  position: 'bottom',
  animation: 'fade-in',
  backgroundOpacity: 0,
};

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  trimStart: 0,
  trimEnd: 0,
  subtitles: true,
  subtitleStyle: DEFAULT_SUBTITLE_STYLE,
  musicVolume: 0.3,
  voiceVolume: 1.0,
  aiCommentary: false,
  watermark: {
    enabled: false,
    position: 'bottom-right',
    opacity: 0.8,
  },
  outputFormat: '9:16',
};
