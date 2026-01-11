import express from 'express';
import cors from 'cors';
import { config } from './config';
import { ForgeController } from './controllers/ForgeController';
import { authMiddleware, requireAuth } from './middleware/auth';
import eventRouter from './routes/event';
import { shareApiRouter, shareRedirectRouter } from './routes/share';

const app = express();
const forgeController = new ForgeController();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Auth middleware (optional, allows anonymous)
app.use(authMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.post('/api/forge', requireAuth, (req, res) => forgeController.forge(req as any, res));
app.post('/api/forge/release', requireAuth, (req, res) => forgeController.release(req as any, res));
app.use('/api', eventRouter);
app.use('/api', shareApiRouter);
app.use('/', shareRedirectRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`🚀 HORNY META FORGE Backend running on port ${port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   OpenAI: ${config.openai.apiKey ? '✅' : '❌'}`);
  console.log(`   Supabase: ${config.supabase.url ? '✅' : '❌'}`);
});
