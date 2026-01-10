import type { Request } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly anonymousLimit: number;
  private readonly authenticatedLimit: number;

  constructor(windowMs: number, anonymousLimit: number, authenticatedLimit: number) {
    this.windowMs = windowMs;
    this.anonymousLimit = anonymousLimit;
    this.authenticatedLimit = authenticatedLimit;

    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Gets a unique identifier for the request (IP + User-Agent hash or user ID).
   */
  private getIdentifier(req: Request): string {
    // If authenticated, use user ID
    const userId = (req as any).userId;
    if (userId) {
      return `user:${userId}`;
    }

    // Otherwise, use IP + User-Agent hash
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ua = req.get('user-agent') || 'unknown';
    // Simple hash
    const hash = Buffer.from(`${ip}:${ua}`).toString('base64').substring(0, 32);
    return `anon:${hash}`;
  }

  /**
   * Checks if request is within rate limit.
   * Returns { allowed: boolean, retryAfter?: number }
   */
  check(req: Request): { allowed: boolean; retryAfter?: number } {
    const identifier = this.getIdentifier(req);
    const isAuthenticated = !!(req as any).userId;
    const limit = isAuthenticated ? this.authenticatedLimit : this.anonymousLimit;

    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now >= entry.resetAt) {
      // New window
      this.limits.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return { allowed: true };
    }

    if (entry.count >= limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    entry.count++;
    return { allowed: true };
  }

  /**
   * Cleans up expired entries.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetAt) {
        this.limits.delete(key);
      }
    }
  }
}

