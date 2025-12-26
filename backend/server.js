import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { verifyEmailConnection } from './services/emailService.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration for production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== SERVER STARTUP ====================
const startServer = async () => {
  try {
    console.log('\n🚀 Starting RAS Currys Backend Server...\n');

    // Connect to MongoDB
    await connectDatabase();

    // Verify email connection
    const emailConnected = await verifyEmailConnection();
    if (!emailConnected) {
      console.warn('⚠️  Warning: Email service not configured. OTP emails will fail.');
      console.warn('⚠️  Please set SMTP_USER and SMTP_PASS in .env file\n');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`\n✓ RAS Currys Backend running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV}`);
      console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`✓ Database: MongoDB Atlas`);
      console.log(`✓ Email Service: Gmail SMTP ${emailConnected ? '(Connected)' : '(Not Configured)'}`);
      console.log(`\n📚 API Documentation:`);
      console.log(`   POST   /api/auth/register       - Register new user`);
      console.log(`   POST   /api/auth/verify-email   - Verify email with OTP`);
      console.log(`   POST   /api/auth/login          - Login user`);
      console.log(`   POST   /api/auth/forgot-password - Request password reset`);
      console.log(`   POST   /api/auth/reset-password - Reset password with OTP`);
      console.log(`   POST   /api/auth/resend-otp     - Resend verification OTP`);
      console.log(`   GET    /api/auth/me             - Get current user (JWT)`);
      console.log(`\n🔐 JWT Authentication: Bearer token required for protected routes`);
      console.log(`📧 OTP Expiry: 10 minutes`);
      console.log(`🔒 Password Hashing: bcrypt (12 rounds)\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
