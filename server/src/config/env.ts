import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  // This build has no accounts, so JWT secrets are not required at runtime.
  // They are defaulted here so the server can start from a lean .env without
  // a separate auth config. If accounts are reintroduced later, restore
  // .min(1, '...') on both of these.
  JWT_SECRET: z.string().default('no-accounts-jwt-secret-do-not-use-in-production'),
  JWT_REFRESH_SECRET: z.string().default('no-accounts-refresh-secret-do-not-use-in-production'),

  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('./storage'),
  MAX_FILE_SIZE_MB: z.string().default('500').transform(Number),
  AI_STT_PROVIDER: z.enum(['mock', 'openai', 'assemblyai', 'deepgram']).default('mock'),
  AI_LLM_PROVIDER: z.enum(['mock', 'openai']).default('mock'),
  AI_TTS_PROVIDER: z.enum(['mock', 'openai', 'elevenlabs']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  ASSEMBLYAI_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  DEEPGRAM_API_KEY: z.string().optional(),
  YTDLP_PATH: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
