'use strict';

// =============================================================
// VPPT — src/config/config.js
// Validates environment variables and supports both local (Laragon)
// and cloud (Railway MySQL & auto-injected variables).
// =============================================================

require('dotenv').config();

const optional = (key, fallback) => process.env[key] ?? fallback;

// Support Railway MySQL auto-injected variables and DATABASE_URL
let dbHost = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1';
let dbPort = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);
let dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'vppt';
let dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
let dbPassword = process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? '';

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
if (dbUrl) {
  try {
    const parsed = new URL(dbUrl);
    if (parsed.hostname) dbHost = parsed.hostname;
    if (parsed.port) dbPort = parseInt(parsed.port, 10);
    if (parsed.username) dbUser = decodeURIComponent(parsed.username);
    if (parsed.password) dbPassword = decodeURIComponent(parsed.password);
    if (parsed.pathname && parsed.pathname.length > 1) {
      dbName = parsed.pathname.slice(1);
    }
  } catch (e) {
    // fallback to individual vars
  }
}

const config = {
  nodeEnv:   optional('NODE_ENV', 'development'),
  port:      parseInt(optional('PORT', '5000'), 10),
  apiPrefix: optional('API_PREFIX', '/api/v1'),

  db: {
    host:            dbHost,
    port:            dbPort,
    name:            dbName,
    user:            dbUser,
    password:        dbPassword,
    connectionLimit: parseInt(optional('DB_CONNECTION_LIMIT', '10'), 10),
    timezone:        optional('DB_TIMEZONE', '+08:00'),
  },

  jwt: {
    secret:             optional('JWT_SECRET', 'vppt_railway_jwt_secret_key_2026_secure'),
    expiresIn:          optional('JWT_EXPIRES_IN', '8h'),
    refreshSecret:      optional('JWT_REFRESH_SECRET', 'vppt_railway_jwt_refresh_secret_key_2026_secure'),
    refreshExpiresIn:   optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  corsOrigins: optional('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  rateLimitWindowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  rateLimitMax:      parseInt(optional('RATE_LIMIT_MAX', optional('NODE_ENV', 'development') === 'development' ? '1000' : '200'), 10),

  logLevel: optional('LOG_LEVEL', 'info'),
  logFile:  optional('LOG_FILE', 'logs/app.log'),

  isProd: optional('NODE_ENV', 'development') === 'production',
  isDev:  optional('NODE_ENV', 'development') === 'development',
};

module.exports = config;