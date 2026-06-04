import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import resourcesRoutes from './routes/resources.routes';
import projectsRoutes from './routes/projects.routes';
import assignmentsRoutes from './routes/assignments.routes';
import analyticsRoutes from './routes/analytics.routes';
import requestsRoutes from './routes/requests.routes';
import templatesRoutes from './routes/templates.routes';
import healthRoutes from './routes/health.routes';
import logger from './utils/logger';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan('dev', {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/health', healthRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
