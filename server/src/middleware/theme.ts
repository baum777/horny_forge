import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { isThemeAvailable, normalizeThemeId } from '../theme/registry';
import { logger } from '../utils/logger';

export type ThemeRequest = Request & { themeId?: string };

const extractRouteTheme = (pathValue: string): string | undefined => {
  const match = pathValue.match(/^\/t\/([^/]+)(\/|$)/);
  return match?.[1];
};

export function resolveThemeId(req: Request): string {
  const hostname = req.hostname || '';
  const hostnameTheme = config.themes.hostnameMap[hostname];
  const headerTheme = req.header('x-theme') || undefined;
  const queryTheme =
    config.nodeEnv !== 'production' && typeof req.query.theme === 'string' ? req.query.theme : undefined;
  const routeTheme = extractRouteTheme(req.path);

  const candidate = hostnameTheme || headerTheme || queryTheme || routeTheme || config.themes.defaultThemeId;
  const normalized = normalizeThemeId(candidate);
  const resolved = normalized && isThemeAvailable(normalized) ? normalized : config.themes.defaultThemeId;

  return resolved;
}

export function themeResolver(req: Request, _res: Response, next: NextFunction) {
  const themeId = resolveThemeId(req);
  (req as ThemeRequest).themeId = themeId;
  logger.info('request', { method: req.method, path: req.path, themeId });
  next();
}


