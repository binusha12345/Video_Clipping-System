// AI Provider Interfaces — STT, LLM, TTS
// These interfaces allow swapping providers without changing business logic

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
  speaker?: string;
}

export interface STTResult {
  segments: TranscriptSegment[];
  fullText: string;
  language?: string;
  duration?: number;
}

export interface ClipAnalysisInput {
  transcript: TranscriptSegment[];
  fullText: string;
  videoMetadata: {
    title: string;
    description: string;
    duration: number;
    uploader?: string;
  };
}

export interface ClipSuggestion {
  title: string;
  startTime: number;
  endTime: number;
  duration: 30 | 60 | 120;
  hook: string;
  reason: string;
  engagementScore: number;
  topics: string[];
  emotions: string[];
  transcriptSlice: TranscriptSegment[];
}

export interface LLMResult {
  clips: ClipSuggestion[];
}

export interface TTSResult {
  audioPath: string;
  duration: number;
}

// Provider interfaces
export interface ISTTProvider {
  name: string;
  transcribe(audioPath: string, language?: string): Promise<STTResult>;
}

export interface ILLMProvider {
  name: string;
  analyzeClips(input: ClipAnalysisInput): Promise<LLMResult>;
  generateCommentary(clipText: string, style?: string): Promise<string>;
}

export interface ITTSProvider {
  name: string;
  synthesize(text: string, voiceId?: string, outputPath?: string): Promise<TTSResult>;
}
