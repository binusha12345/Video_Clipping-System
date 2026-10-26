import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

// This build performs no registration or login.
// Every request is treated as authenticated so the dashboard, projects,
// render and export routes all work without an accounts system.
// The token-verification helpers below are kept so the client-side
// axios refresh interceptor (api.ts) does not throw on startup.

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  // No-op: treat every request as authenticated.
  // If you reintroduce accounts later, restore JWT verification here.
  next();
}

/** @deprecated this build has no accounts; kept to satisfy the client refresh interceptor. */
export function generateTokens(_userId: string, _email: string): { accessToken: string; refreshToken: string } {
  return { accessToken: '', refreshToken: '' };
}

/** @deprecated this build has no accounts; kept to satisfy the client refresh interceptor. */
export function verifyRefreshToken(_token: string): { userId: string; email: string; iat: number; exp: number } {
  return { userId: '', email: '', iat: 0, exp: 0 };
}
