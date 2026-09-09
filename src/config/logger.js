'use strict';

// =============================================================
// VPPT — src/config/logger.js
// Winston logger with console (colourized) and file (JSON) transports.
// Log level is controlled by config.logLevel (defaults to 'debug').
// Import this module everywhere instead of using console.log.
// =============================================================

const { createLogger, format, transports } = require('winston');
const path   = require('path');
const fs     = require('fs');
const config = require('./config');

// Ensure log directory exists
const logDir = path.dirname(config.logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors, json } = format;

// Human-readable format for console output
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return stack
      ? `${ts} [${level}] ${message}\n${stack}`
      : `${ts} [${level}] ${message}`;
  }),
);

// Structured JSON format for file output
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

const logger = createLogger({
  level: config.logLevel,
  transports: [
    new transports.Console({ format: consoleFormat }),
    new transports.File({
      filename: config.logFile,
      format:   fileFormat,
      level:    'info',
      maxsize:  10 * 1024 * 1024,  // 10 MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
  exitOnError: false,
});

// Add 'http' level (used by morgan stream in app.js)
logger.http = (message) => logger.log('http', message);

module.exports = logger;
