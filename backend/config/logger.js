import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../logs');

/**
 * Winston Logger Configuration
 * Structured logging with multiple transports
 */

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, ...args } = info;
    const requestIdStr = requestId ? `[${requestId}] ` : '';
    const ts = `${timestamp}`;
    return `${ts} ${level}: ${requestIdStr}${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
  })
);

const transports = [
  // Console transport for all logs
  new winston.transports.Console(),

  // Error logs file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.printf((info) => {
        const { timestamp, level, message, requestId, stack, ...args } = info;
        const requestIdStr = requestId ? `[${requestId}] ` : '';
        return `${timestamp} ${level}: ${requestIdStr}${message}\n${stack || ''} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
      })
    ),
  }),

  // Combined logs file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.printf((info) => {
        const { timestamp, level, message, requestId, ...args } = info;
        const requestIdStr = requestId ? `[${requestId}] ` : '';
        return `${timestamp} ${level}: ${requestIdStr}${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
      })
    ),
  }),

  // HTTP logs file
  new winston.transports.File({
    filename: path.join(logsDir, 'http.log'),
    level: 'http',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.printf((info) => {
        const { timestamp, level, message, requestId, ...args } = info;
        const requestIdStr = requestId ? `[${requestId}] ` : '';
        return `${timestamp} ${level}: ${requestIdStr}${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
      })
    ),
  }),
];

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format,
  transports,
});

// Create logs directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;
