import { create } from 'zustand';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface ClipCandidate {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  transcript: TranscriptSegment[];
  fullText: string;
  hook: string;
  reason: string;
  engagementScore: number;
  topics: string[];
  emotions: string[];
  thumbnailUrl?: string;
}

export interface VideoMetadata {
  title: string;
  description: string;
  duration: number;
  uploader?: string;
  thumbnailUrl?: string;
  viewCount?: number;
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
  rightsType?: string;
  rightsSafeMode: boolean;
  status: 'PENDING' | 'DOWNLOADING' | 'ANALYZING' | 'READY' | 'ERROR';
  statusMessage?: string;
  clips: ClipCandidate[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  selectedClip: ClipCandidate | null;
  isLoading: boolean;
  pollingInterval: ReturnType<typeof setInterval> | null;

  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  setSelectedClip: (clip: ClipCandidate | null) => void;
  setLoading: (loading: boolean) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  setPollingInterval: (interval: ReturnType<typeof setInterval> | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,
  selectedClip: null,
  isLoading: false,
  pollingInterval: null,

  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      activeProject:
        state.activeProject?.id === id
          ? { ...state.activeProject, ...updates }
          : state.activeProject,
    })),
  setSelectedClip: (clip) => set({ selectedClip: clip }),
  setLoading: (isLoading) => set({ isLoading }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProject: state.activeProject?.id === id ? null : state.activeProject,
    })),
  setPollingInterval: (interval) => set({ pollingInterval: interval }),
}));
