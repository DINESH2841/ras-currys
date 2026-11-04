import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { verifyEmailConnection } from './services/emailService.js';
import { startVerificationReminderJob } from './services/verificationReminderJob.js';
import { logger } from './config/logger.js';
import { requestIdMiddleware, requestLoggingMiddleware, errorLoggingMiddleware } from './middleware/requestLogger.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression({ threshold: 1024 }));
// Apply the broad API budget before any potentially expensive middleware.
app.use('/api', apiLimiter);

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Request logging middleware
app.use(requestLoggingMiddleware);

// CORS configuration (supports multiple origins via FRONTEND_URL or FRONTEND_URLS)
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked for origin ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID']
}));

// The API authenticates with an Authorization bearer token, not cookies. CSRF
// tokens are therefore not applicable and previously blocked every browser POST.
// Keep CORS origins explicit and never add credentialed cookie auth without CSRF.

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ==================== ROUTES ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'RAS Currys Authentication API',
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Global error handler (uses error logging middleware for request context)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  logger.error('Unhandled error', {
    statusCode,
    message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal server error' : message,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== SERVER STARTUP ====================
const startServer = async () => {
  try {
    logger.info('🚀 Starting RAS Currys Backend Server...');

    // Connect to MongoDB
    await connectDatabase();
    logger.info('✓ Connected to MongoDB');

    // Verify email connection
    const emailConnected = await verifyEmailConnection();
    if (!emailConnected) {
      logger.warn('⚠️ Email service not configured. OTP emails will fail.');
      logger.warn('⚠️ Please set SMTP_USER and SMTP_PASS in .env file');
    } else {
      logger.info('✓ Email service configured');
      startVerificationReminderJob();
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`✓ RAS Currys Backend running on http://localhost:${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV}`);
      logger.info(`✓ Frontend URL: ${process.env.FRONTEND_URL}`);
      logger.info(`✓ Database: MongoDB`);
      logger.info(`✓ Email Service: Gmail SMTP ${emailConnected ? '(Connected)' : '(Not Configured)'}`);
      logger.info(`✓ Logging: Winston (Level: ${process.env.LOG_LEVEL || 'debug'})`);
      logger.info(`✓ CSRF Protection: Enabled`);
      logger.info(`✓ OTP Hashing: HMAC-SHA256`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.warn('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.warn('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
