import { create } from 'zustand';

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  outlineColor: string;
  outlineWidth: number;
  bold: boolean;
  italic: boolean;
  position: 'top' | 'middle' | 'bottom';
  animation: 'none' | 'fade-in' | 'slide-up' | 'typewriter' | 'bounce';
  backgroundColor?: string;
  backgroundOpacity?: number;
}

export interface WatermarkConfig {
  enabled: boolean;
  text?: string;
  imageUrl?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  scale?: number;
}

export interface EditorConfig {
  trimStart: number;
  trimEnd: number;
  subtitles: boolean;
  subtitleStyle: SubtitleStyle;
  musicTrackId?: string;
  musicVolume: number;
  voiceVolume: number;
  aiCommentary: boolean;
  aiCommentaryText?: string;
  aiVoiceId?: string;
  watermark: WatermarkConfig;
}

const defaultSubtitleStyle: SubtitleStyle = {
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

const defaultEditorConfig: EditorConfig = {
  trimStart: 0,
  trimEnd: 0,
  subtitles: true,
  subtitleStyle: defaultSubtitleStyle,
  musicVolume: 0.3,
  voiceVolume: 1.0,
  aiCommentary: false,
  watermark: {
    enabled: false,
    position: 'bottom-right',
    opacity: 0.8,
  },
};

interface EditorState {
  config: EditorConfig;
  activeTab: 'trim' | 'subtitles' | 'music' | 'watermark' | 'voice';
  clipDuration: number;
  currentRenderJobId: string | null;

  setConfig: (updates: Partial<EditorConfig>) => void;
  setSubtitleStyle: (updates: Partial<SubtitleStyle>) => void;
  setWatermark: (updates: Partial<WatermarkConfig>) => void;
  setActiveTab: (tab: EditorState['activeTab']) => void;
  setClipDuration: (duration: number) => void;
  setCurrentRenderJobId: (id: string | null) => void;
  resetConfig: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  config: defaultEditorConfig,
  activeTab: 'trim',
  clipDuration: 60,
  currentRenderJobId: null,

  setConfig: (updates) =>
    set((state) => ({ config: { ...state.config, ...updates } })),

  setSubtitleStyle: (updates) =>
    set((state) => ({
      config: {
        ...state.config,
        subtitleStyle: { ...state.config.subtitleStyle, ...updates },
      },
    })),

  setWatermark: (updates) =>
    set((state) => ({
      config: {
        ...state.config,
        watermark: { ...state.config.watermark, ...updates },
      },
    })),

  setActiveTab: (activeTab) => set({ activeTab }),
  setClipDuration: (clipDuration) => set({ clipDuration }),
  setCurrentRenderJobId: (currentRenderJobId) => set({ currentRenderJobId }),
  resetConfig: () => set({ config: defaultEditorConfig, activeTab: 'trim' }),
}));
