import express, { type RequestHandler } from 'express';
import path from 'node:path';
import cors from 'cors';
import { config } from './config';
import type { ForgeController } from './controllers/ForgeController';
import { authMiddleware as defaultAuthMiddleware, requireAuth as defaultRequireAuth, type AuthenticatedRequest } from './middleware/auth';
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
import { memePoolRouter } from './routes/memePool';

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

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  }));
  app.use(express.static(path.join(process.cwd(), 'public')));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/horny_base', express.static(path.join(process.cwd(), 'public', 'horny_base')));

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', true);

  // Auth middleware (optional, allows anonymous)
  app.use(authMiddleware);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.post('/api/forge', requireAuth, (req, res) => forgeController.forge(req as AuthenticatedRequest, res));
  app.post('/api/forge/release', requireAuth, (req, res) => forgeController.release(req as AuthenticatedRequest, res));
  app.use('/api', memePoolRouter);
  app.use('/api', eventRouter);
  app.use('/api', shareRouters.shareApiRouter);
  app.use('/api', tokenStatsRouter);
  app.use('/api', dashboardRouter);
  app.use('/api', actionsRouter);
  app.use('/api', badgesRouter);
  app.use('/api', rewardsRouter);
  app.use('/api', statusRouter);
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
