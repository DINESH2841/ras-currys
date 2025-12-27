import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 * Prevents brute force attacks on critical endpoints
 */

// Login endpoint: 5 attempts per 10 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 attempts
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req, res) => req.ip, // Key by IP address
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again in 10 minutes.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  skip: (req) => process.env.NODE_ENV === 'test' // Skip in test environment
});

// Email verification: 5 attempts per 10 minutes per email
export const emailVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => req.body?.email || req.ip, // Key by email or IP
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many verification attempts. Please try again in 10 minutes.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  skip: (req) => process.env.NODE_ENV === 'test'
});

// Forgot password: 3 requests per hour per email
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => req.body?.email || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset requests. Please try again in 1 hour.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  skip: (req) => process.env.NODE_ENV === 'test'
});

// Registration: 3 requests per day per email
export const registrationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 requests
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => req.body?.email || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many registration attempts. Please try again tomorrow.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  skip: (req) => process.env.NODE_ENV === 'test'
});

// General API rate limiter: 100 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.'
    });
  },
  skip: (req) => process.env.NODE_ENV === 'test'
});

export default {
  loginLimiter,
  emailVerificationLimiter,
  forgotPasswordLimiter,
  registrationLimiter,
  apiLimiter
};
