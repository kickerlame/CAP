'use strict';

require('dotenv').config();
const app    = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const db     = require('./config/database');

async function start() {
  try {
    // Verify DB connectivity before accepting traffic
    await db.query('SELECT 1');
    logger.info('Database connection verified.');

    const server = app.listen(config.port, () => {
      logger.info(`VPPT API running — http://localhost:${config.port}${config.apiPrefix}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully.`);
      server.close(async () => {
        await db.end();
        logger.info('HTTP server and DB pool closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
