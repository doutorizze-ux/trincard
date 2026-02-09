/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import partnersRoutes from './routes/partners.js';
import plansRoutes from './routes/plans.js';
import usersRoutes from './routes/users.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import publicRoutes from './routes/public.js';
import uploadRoutes from './routes/upload.js';
import webhookRoutes from './routes/webhooks.js';
import checkoutRoutes from './routes/checkout.js';
import adminRoutes from './routes/admin.js';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/admin', adminRoutes);

// Servir arquivos estáticos de uploads
// Nota: Em produção no Coolify, garanta que a pasta uploads seja persistente (volume)
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error); // Log do erro
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * Serve static files in production
 */
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  // SPA fallback
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, error: 'API not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

/**
 * 404 handler for API
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;