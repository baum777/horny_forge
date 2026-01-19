import express, { type RequestHandler } from 'express';
import path from 'node:path';
import cors from 'cors';
import { config } from './config';
import type { ForgeController } from './controllers/ForgeController';
import { authMiddleware as defaultAuthMiddleware, requireAuth as defaultRequireAuth, type AuthenticatedRequest } from './middleware/auth';
import { forgeRateLimit } from './middleware/rateLimit';
import { themeResolver } from './middleware/theme';
import createEventRouter from './routes/event';
import createOgRouter from './routes/og';
import { createShareRouters } from './routes/share';
import tokenStatsRouter from './routes/tokenStats';
import { gamificationRouter } from './routes/gamification';
import { adminRouter } from './routes/admin';
import dashboardRouter from './routes/dashboardRouter';
import actionsRouter from './routes/actionsRouter';
import badgesRouter from './routes/badgesRouter';
import rewardsRouter from './routes/rewardsRouter';
import statusRouter from './routes/statusRouter';
import { assetPoolRouter } from './routes/assetPool';
import createContentItemsRouter from './routes/contentItems';
import createGalleryRouter from './routes/galleryRouter';
import createQuestsRouter from './routes/questsRouter';
import themeRouter from './routes/theme';

type AppDependencies = {
  forgeController?: ForgeController;
  authMiddleware?: RequestHandler;
  requireAuth?: RequestHandler;
  awardEvent?: Parameters<typeof createEventRouter>[0];
  supabaseAdmin?: Parameters<typeof createOgRouter>[0];
};

export async function createApp(deps: AppDependencies = {}) {
  const app = express();
  const forgeController =
    deps.forgeController ??
    new (await import('./controllers/ForgeController')).ForgeController();
  const authMiddleware = deps.authMiddleware ?? defaultAuthMiddleware;
  const requireAuth = deps.requireAuth ?? defaultRequireAuth;
  const eventRouter = createEventRouter(deps.awardEvent);
  const ogRouter = createOgRouter(deps.supabaseAdmin);
  const shareRouters = createShareRouters(deps.supabaseAdmin);
  const galleryRouter = createGalleryRouter();
  const questsRouter = createQuestsRouter();

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  }));
  app.use(express.static(path.join(process.cwd(), 'server', 'public')));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', true);

  // Auth middleware (optional, allows anonymous)
  app.use(themeResolver);
  app.use(authMiddleware);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/themes', themeRouter);
  app.use('/themes', express.static(path.join(process.cwd(), 'themes')));

  // API Routes
  app.post('/api/forge', requireAuth, forgeRateLimit, (req, res) => forgeController.forge(req as AuthenticatedRequest, res));
  app.post('/api/forge/preview', requireAuth, forgeRateLimit, (req, res) => forgeController.forge(req as AuthenticatedRequest, res));
  app.post('/api/forge/release', requireAuth, forgeRateLimit, (req, res) => forgeController.release(req as AuthenticatedRequest, res));
  app.use('/api', assetPoolRouter);
  app.use('/api', eventRouter);
  app.use('/api', shareRouters.shareApiRouter);
  app.use('/api', tokenStatsRouter);
  app.use('/api', dashboardRouter);
  app.use('/api', actionsRouter);
  app.use('/api', badgesRouter);
  app.use('/api', rewardsRouter);
  app.use('/api', statusRouter);
  app.use('/api', galleryRouter);
  app.use('/api', questsRouter);
  app.use('/api', createContentItemsRouter(deps.supabaseAdmin));
  app.use('/api/gamification', gamificationRouter);
  app.use('/api/admin', adminRouter);
  app.use('/', ogRouter);
  app.use('/', shareRouters.shareRedirectRouter);

  // Error handling
  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      code: 'NOT_FOUND',
    });
  });

  return app;
}
