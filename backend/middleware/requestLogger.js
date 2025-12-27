import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';

/**
 * Request ID Middleware
 * Adds a unique request ID to all requests for tracking and logging
 */
export const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  req.requestId = requestId;

  // Add request ID to all responses
  res.setHeader('X-Request-ID', requestId);

  // Add request ID to locals for use in other middleware
  res.locals.requestId = requestId;

  next();
};

/**
 * Request Logging Middleware
 * Logs all incoming requests with request ID
 */
export const requestLoggingMiddleware = (req, res, next) => {
  const start = Date.now();

  // Log incoming request
  logger.http(`${req.method} ${req.path}`, {
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.path} ${res.statusCode}`, {
      requestId: req.id,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};

/**
 * Error Logging Middleware
 * Logs errors with request ID for debugging
 */
export const errorLoggingMiddleware = (err, req, res, next) => {
  logger.error(err.message || 'Unknown error', {
    requestId: req.id,
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    path: req.path,
  });

  next(err);
};

export default {
  requestIdMiddleware,
  requestLoggingMiddleware,
  errorLoggingMiddleware,
};
