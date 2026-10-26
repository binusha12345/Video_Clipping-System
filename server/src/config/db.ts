import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const RETRY_ATTEMPTS = 6;
const RETRY_DELAY_MS = 3000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const LOCAL_URI = 'mongodb://127.0.0.1:27017/clipforge';

/** Strip credentials before a connection string is ever written to the log. */
function redactUri(uri: string): string {
  return uri.replace(/\/\/[^@/]+@/, '//***@');
}

export async function connectDB(): Promise<void> {
  const isLocalUri = env.MONGODB_URI.includes('127.0.0.1') || env.MONGODB_URI.includes('localhost');
  // The local development MongoDB (npm run dev:db) may still be booting when the
  // API starts, so retry a few times against a local URI before giving up.
  const attempts = isLocalUri ? RETRY_ATTEMPTS : 1;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info('✅ MongoDB connected successfully');
      return;
    } catch (error: any) {
      if (attempt < attempts) {
        logger.warn(
          `⏳ MongoDB not reachable (attempt ${attempt}/${attempts}): ${error.message || error}. Retrying in ${RETRY_DELAY_MS / 1000}s...`
        );
        await delay(RETRY_DELAY_MS);
        continue;
      }
      if (isLocalUri) {
        logger.error(`❌ MongoDB connection failed (${redactUri(env.MONGODB_URI)}):`, error.message || error);
        throw error;
      }
      await connectToLocalFallback(error);
      // Local fallback already connected; do not re-throw.
    }
  }
}

/** If the configured (remote) URI is unreachable, try the local development MongoDB. */
async function connectToLocalFallback(error: any): Promise<void> {
  logger.error(`❌ MongoDB connection failed (${redactUri(env.MONGODB_URI)}):`, error.message || error);

  try {
    logger.info(`🔄 Attempting fallback connection to local MongoDB (${LOCAL_URI})...`);
    await mongoose.connect(LOCAL_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    logger.info('✅ Connected to local MongoDB successfully!');    } catch (fallbackErr: any) {
    logger.warn(
      `Could not connect to MongoDB. The server will continue in an offline metadata
       mode. Paste a valid YouTube URL; analysis uses mock AI, and project data
       persists only while the server is running. To use MongoDB, copy .env.example
       to .env, set MONGODB_URI to a reachable connection string, and restart.`
    );
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Reconnecting...');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err);
});

// ============================
// This build has no accounts. The legacy User model is removed.
// If accounts are reintroduced later, re-add src/routes/auth.ts, the
// register/login schemas, and the bcrypt password flow.
//
// Safety: the .env.example MongoDB URI placeholder kept below is traffic-light
// red so it is obvious on review. It is intentionally not a real credential.

