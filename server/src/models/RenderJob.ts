import mongoose, { Document, Schema } from 'mongoose';

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type JobType = 'ANALYZE' | 'RENDER';

export interface IEditorConfig {
  trimStart: number;
  trimEnd: number;
  subtitles: boolean;
  subtitleStyle: {
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
  };
  musicTrackId?: string;
  musicVolume: number;
  voiceVolume: number;
  aiCommentary: boolean;
  aiCommentaryText?: string;
  aiVoiceId?: string;
  watermark: {
    enabled: boolean;
    text?: string;
    imageUrl?: string;
    position: string;
    opacity: number;
    scale?: number;
  };
}

export interface IRenderJob extends Document {
  _id: any;
  projectId: mongoose.Types.ObjectId;
  clipId: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  stage?: string;
  outputPath?: string;
  editorConfig: IEditorConfig;
  error?: string;
  retries: number;
  createdAt: Date;
  updatedAt: Date;
}

const editorConfigSchema = new Schema({}, { _id: false, strict: false });

const renderJobSchema = new Schema<IRenderJob>(
  {
    _id: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    clipId: { type: String, required: true },
    type: { type: String, enum: ['ANALYZE', 'RENDER'], default: 'RENDER' },
    status: {
      type: String,
      enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'QUEUED',
      index: true,
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    stage: String,
    outputPath: String,
    editorConfig: editorConfigSchema,
    error: String,
    retries: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
        return ret;
      },
    },
  }
);

export const RenderJob = mongoose.model<IRenderJob>('RenderJob', renderJobSchema);
