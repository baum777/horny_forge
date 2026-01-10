import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userHandle?: string;
  userAvatar?: string;
}

/**
 * Middleware to extract and validate Supabase session from Authorization header or cookies.
 * Sets req.userId if authenticated, otherwise allows anonymous access.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      // Anonymous access allowed
      return next();
    }

    // Validate token with Supabase
    const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Invalid token, but allow anonymous access
      return next();
    }

    // Set user info on request
    req.userId = user.id;
    req.userHandle = user.user_metadata?.user_name || user.user_metadata?.preferred_username || user.user_metadata?.name;
    req.userAvatar = user.user_metadata?.avatar_url;

    next();
  } catch (error) {
    // On error, allow anonymous access
    next();
  }
}

/**
 * Middleware that requires authentication.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.userId) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
    return;
  }
  next();
}

