import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { createError } from './errorHandler';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return next(createError(message, 422));
    }
    req.body = result.data;
    next();
  };
}

// Common validation schemas (auth schemas removed — this build has no accounts)
export const analyzeSchema = z.object({
  url: z.string().url(),
  rightsConfirmed: z.boolean(),
  rightsType: z.enum(['OWNER', 'LICENSED', 'CREATIVE_COMMONS', 'PUBLIC_DOMAIN', 'FAIR_USE_CLAIM']),
  rightsSafeMode: z.boolean().optional().default(false),
});

export const renderSchema = z.object({
  projectId: z.string(),
  clipId: z.string(),
  editorConfig: z.object({
    trimStart: z.number().min(0).default(0),
    trimEnd: z.number().min(0).default(0),
    subtitles: z.boolean().default(true),
    subtitleStyle: z.object({
      fontFamily: z.string().default('Inter'),
      fontSize: z.number().min(12).max(100).default(42),
      color: z.string().default('#FFFFFF'),
      outlineColor: z.string().default('#000000'),
      outlineWidth: z.number().min(0).max(10).default(2),
      bold: z.boolean().default(true),
      italic: z.boolean().default(false),
      position: z.enum(['top', 'middle', 'bottom']).default('bottom'),
      animation: z.enum(['none', 'fade-in', 'slide-up', 'typewriter', 'bounce']).default('fade-in'),
      backgroundColor: z.string().optional(),
      backgroundOpacity: z.number().min(0).max(1).optional(),
    }),
    musicTrackId: z.string().optional(),
    musicVolume: z.number().min(0).max(1).default(0.3),
    voiceVolume: z.number().min(0).max(1).default(1.0),
    aiCommentary: z.boolean().default(false),
    aiCommentaryText: z.string().optional(),
    aiVoiceId: z.string().optional(),
    watermark: z.object({
      enabled: z.boolean().default(false),
      text: z.string().optional(),
      imageUrl: z.string().optional(),
      position: z.string().default('bottom-right'),
      opacity: z.number().min(0).max(1).default(0.8),
      scale: z.number().optional(),
    }),
  }),
});
