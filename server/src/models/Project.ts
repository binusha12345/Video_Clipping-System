import mongoose, { Document, Schema } from 'mongoose';

export type RightsType = 'OWNER' | 'LICENSED' | 'CREATIVE_COMMONS' | 'PUBLIC_DOMAIN' | 'FAIR_USE_CLAIM';
export type ProjectStatus = 'PENDING' | 'DOWNLOADING' | 'ANALYZING' | 'READY' | 'ERROR';

export interface IClipCandidate {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  transcript: { start: number; end: number; text: string; confidence?: number }[];
  fullText: string;
  hook: string;
  reason: string;
  engagementScore: number;
  topics: string[];
  emotions: string[];
  thumbnailUrl?: string;
}

export interface IVideoMetadata {
  title: string;
  description: string;
  duration: number;
  uploader?: string;
  uploadDate?: string;
  viewCount?: number;
  likeCount?: number;
  thumbnailUrl?: string;
  language?: string;
  isLiveContent?: boolean;
}

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  // Accounts were removed from this build. userId is kept only for
  // forward compatibility; it is not used for access control here.
  userId?: mongoose.Types.ObjectId | string;
  sourceUrl: string;
  sourceType: 'youtube' | 'upload';
  videoPath?: string;
  audioPath?: string;
  videoMetadata?: IVideoMetadata;
  rightsConfirmed: boolean;
  rightsType?: RightsType;
  rightsTimestamp?: Date;
  rightsSafeMode: boolean;
  status: ProjectStatus;
  statusMessage?: string;
  clips: IClipCandidate[];
  createdAt: Date;
  updatedAt: Date;
}

const transcriptSegmentSchema = new Schema(
  {
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    text: { type: String, required: true },
    confidence: Number,
    speaker: String,
  },
  { _id: false }
);

const clipCandidateSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    duration: { type: Number, required: true },
    transcript: [transcriptSegmentSchema],
    fullText: { type: String, default: '' },
    hook: { type: String, default: '' },
    reason: { type: String, default: '' },
    engagementScore: { type: Number, min: 0, max: 100, default: 0 },
    topics: [String],
    emotions: [String],
    thumbnailUrl: String,
  },
  { _id: false }
);

const videoMetadataSchema = new Schema(
  {
    title: String,
    description: String,
    duration: Number,
    uploader: String,
    uploadDate: String,
    viewCount: Number,
    likeCount: Number,
    thumbnailUrl: String,
    language: String,
    isLiveContent: Boolean,
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.Mixed, index: true }, // kept for compatibility; not enforced
    sourceUrl: { type: String, required: true },
    sourceType: { type: String, enum: ['youtube', 'upload'], default: 'youtube' },
    videoPath: String,
    audioPath: String,
    videoMetadata: videoMetadataSchema,
    rightsConfirmed: { type: Boolean, default: false },
    rightsType: {
      type: String,
      enum: ['OWNER', 'LICENSED', 'CREATIVE_COMMONS', 'PUBLIC_DOMAIN', 'FAIR_USE_CLAIM'],
    },
    rightsTimestamp: Date,
    rightsSafeMode: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['PENDING', 'DOWNLOADING', 'ANALYZING', 'READY', 'ERROR'],
      default: 'PENDING',
    },
    statusMessage: String,
    clips: [clipCandidateSchema],
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

export const Project = mongoose.model<IProject>('Project', projectSchema);
