import { Router } from 'express';
import { config } from '../config';
import { loadThemeConfig } from '../theme/loader';
import type { ThemeRequest } from '../middleware/theme';

const themeRouter = Router();

const getPreferredLanguage = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) return value[0];
  if (typeof value === 'string') return value;
  return undefined;
};

themeRouter.get('/:themeId/config', (req, res) => {
  try {
    const requestedThemeId = req.params.themeId;
    const resolvedRequest =
      requestedThemeId === 'current'
        ? (req as ThemeRequest).themeId ?? config.themes.defaultThemeId
        : requestedThemeId;
    const language = getPreferredLanguage(req.headers['accept-language']);
    const { config: themeConfig, etag } = loadThemeConfig({
      themeId: resolvedRequest,
      fallbackThemeId: config.themes.defaultThemeId,
      language,
      assetsBaseUrl: config.themes.baseUrl,
      enableCache: config.nodeEnv === 'production',
    });

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.setHeader('ETag', etag);
    res.setHeader('Vary', 'Accept-Language, X-Theme, Host');

    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    res.json(themeConfig);
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Theme config unavailable',
    });
  }
});

export default themeRouter;


