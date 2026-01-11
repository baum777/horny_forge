import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth';

// Simple in-memory rate limiter (use Redis in production)
type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req);
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (entry.count >= maxRequests) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
      return;
    }

    entry.count++;
    next();
  };
}

function getDefaultKey(req: Request): string {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId || 'anonymous';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `${userId}:${ip}`;
}

// Pre-configured rate limiters
export const gamificationActionRateLimit = createRateLimiter({
  windowMs: 60_000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  keyGenerator: (req) => {
    const authReq = req as AuthenticatedRequest;
    return `gamification:${authReq.userId || req.ip || 'anonymous'}`;
  },
});

export const ipRateLimit = createRateLimiter({
  windowMs: 60_000, // 1 minute
  maxRequests: 100, // 100 requests per minute per IP
  keyGenerator: (req) => `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`,
});

