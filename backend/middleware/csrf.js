import Tokens from 'csrf';
import { logger } from '../config/logger.js';

const tokens = new Tokens();

/**
 * CSRF Protection Middleware
 * Prevents Cross-Site Request Forgery attacks
 */

// Store tokens in memory (for production, use Redis or session store)
const tokenStore = new Map();

/**
 * Generate and store CSRF token for a session
 */
export const generateCsrfToken = (sessionId) => {
  try {
    // Generate secret if not exists
    if (!tokenStore.has(sessionId)) {
      const secret = tokens.secretSync();
      tokenStore.set(sessionId, { secret, tokens: new Set() });
    }

    const session = tokenStore.get(sessionId);
    const token = tokens.create(session.secret);
    session.tokens.add(token);

    return token;
  } catch (error) {
    logger.error('CSRF token generation failed', {
      error: error.message,
      sessionId,
    });
    throw error;
  }
};

/**
 * Middleware to add CSRF token to response
 */
export const csrfTokenMiddleware = (req, res, next) => {
  try {
    // Use request ID as session ID (or user ID in production)
    const sessionId = req.user?.userId || req.id;
    const token = generateCsrfToken(sessionId);

    // Send token in both header and body
    res.setHeader('X-CSRF-Token', token);
    res.locals.csrfToken = token;

    next();
  } catch (error) {
    logger.error('CSRF middleware error', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_ERROR',
        message: 'Failed to generate CSRF token',
      },
    });
  }
};

/**
 * Middleware to verify CSRF token on state-changing requests
 */
export const verifyCsrfToken = (req, res, next) => {
  // Only verify on state-changing requests
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Skip CSRF verification for webhooks (they have their own signature verification)
  if (req.path === '/api/payments/webhook' || req.path.includes('/webhook')) {
    return next();
  }

  try {
    // Get CSRF token from headers or body
    const token = req.headers['x-csrf-token'] || req.body?.csrfToken;

    if (!token) {
      logger.warn('CSRF token missing', {
        requestId: req.id,
        method: req.method,
        path: req.path,
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token is required for this operation',
        },
      });
    }

    // Get session
    const sessionId = req.user?.userId || req.id;
    const session = tokenStore.get(sessionId);

    if (!session) {
      logger.warn('CSRF session not found', {
        requestId: req.id,
        sessionId,
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_SESSION_INVALID',
          message: 'CSRF session is invalid',
        },
      });
    }

    // Verify token
    const isValid = tokens.verify(session.secret, token);

    if (!isValid) {
      logger.warn('CSRF token verification failed', {
        requestId: req.id,
        method: req.method,
        path: req.path,
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'CSRF token verification failed',
        },
      });
    }

    // Token used, mark it as consumed (optional for one-time use)
    session.tokens.delete(token);

    // Generate new token for next request
    const newToken = tokens.create(session.secret);
    session.tokens.add(newToken);
    res.setHeader('X-CSRF-Token', newToken);

    logger.debug('CSRF token verified successfully', {
      requestId: req.id,
    });

    next();
  } catch (error) {
    logger.error('CSRF verification error', {
      requestId: req.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'CSRF_VERIFICATION_ERROR',
        message: 'CSRF verification failed',
      },
    });
  }
};

/**
 * Cleanup old CSRF sessions (call periodically)
 */
export const cleanupCsrfSessions = () => {
  // In production, implement session expiration
  // For now, just log the current size
  logger.debug(`CSRF token store size: ${tokenStore.size}`);
};

export default {
  generateCsrfToken,
  csrfTokenMiddleware,
  verifyCsrfToken,
  cleanupCsrfSessions,
};
