'use strict';

const path         = require('path');
const fs           = require('fs');
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const compression  = require('compression');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const config       = require('./config/config');
const logger       = require('./config/logger');
const db           = require('./config/database');
const routes       = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// ── Security headers ──────────────────────────────────────────
// Configure helmet so frontend static assets, Google fonts, and inline styles are not blocked
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = config.corsOrigins;
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. curl, Postman, or same-origin SPA)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return cb(null, true);
    }
    // Allow Railway hosted domains automatically
    if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PUBLIC_DOMAIN) {
      return cb(null, true);
    }
    cb(new Error(`CORS policy: origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ── HTTP request logging ──────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Health check (outside prefix, no auth, exempt from rate limit) ─
app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ── Global rate limiter ───────────────────────────────────────
app.use(rateLimit({
  windowMs: config.rateLimitWindowMs,
  max:      config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
}));

// ── API Routes ────────────────────────────────────────────────
app.use(config.apiPrefix, routes);

// ── Serve Frontend SPA (Production Monorepo on Railway) ───────
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  logger.info(`Serving frontend static build from ${frontendDist}`);
  app.use(express.static(frontendDist));

  // SPA fallback for all non-API GET routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith(config.apiPrefix) || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── 404 & global error handlers ──────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;