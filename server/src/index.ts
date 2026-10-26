import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { registerRenderWorker } from './services/jobs/worker';
import { storagePath } from './config/storage';

import { projectsRouter } from './routes/projects';
import { renderRouter } from './routes/render';
import { exportRouter } from './routes/export';

const app = express();

export default app;
export { app };


// ── Security Middleware ──────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS ────────────────────────────────────────────────────
// In development, allow any localhost/127.0.0.1 origin on any port so Vite's
// auto-incremented dev ports (5173, 5174, 5175, ...) never break the proxy.
// Production still uses the strict allowlist from CORS_ORIGINS.
const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
const isDev = env.NODE_ENV === 'development';
const isLocalhostOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header (curl, Postman, same-origin fetch) — always allowed.
      if (!origin) return callback(null, true);

      // Development: any localhost port is allowed.
      if (isDev && isLocalhostOrigin(origin)) return callback(null, true);

      // Production (or non-localhost in dev): strict allowlist.
      if (allowedOrigins.includes(origin)) return callback(null, true);

      callback(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── Rate Limiting ────────────────────────────────────────────
// Rate limiting is DISABLED in development: the UI polls project status
// every ~3s while the analysis pipeline runs, so a production-sized limit
// (100 req / 15 min) trips within minutes and 429s every subsequent request,
// including the dashboard. This is a local single-user dev app.
// Production keeps the configurable limiter from env.
if (!isDev) {
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      message: { success: false, error: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path.includes('/render'),
    })
  );
}

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.NODE_ENV,
  });
});

// NOTE: the storage directory is intentionally NOT served statically.
// It holds private user media (uploaded videos, audio, renders); rendered
// clips are delivered through the authenticated /api/export/:jobId route.

// ── API Routes ───────────────────────────────────────────────
// Auth routes removed: this build performs no registration/login.
// Every request is treated as authenticated (see middleware/auth.ts).
app.use('/api/projects', projectsRouter);
app.use('/api/render', renderRouter);
app.use('/api/export', exportRouter);

// ── 404 ──────────────────────────────────────────────────────
app.use(notFound);

// ── Error Handler ────────────────────────────────────────────
app.use(errorHandler);

// ── Startup ──────────────────────────────────────────────────
async function start() {
  try {
    await connectDB();

    // Register job workers
    registerRenderWorker();

    app.listen(env.PORT, async () => {
      logger.info(`
╔═══════════════════════════════════════════╗
║       ClipForge AI Server Started         ║
╠═══════════════════════════════════════════╣
║  Port:     ${String(env.PORT).padEnd(32)}║
║  Env:      ${env.NODE_ENV.padEnd(32)}║
║  Storage:  ${storagePath.substring(0, 32).padEnd(32)}║
║  Mode:     no-accounts / always-authenticated║
╚═══════════════════════════════════════════╝`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}start();

