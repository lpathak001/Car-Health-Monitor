// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { pool } from './config/database';
import { redisManager } from './config/redis';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize Redis connection
    await redisManager.connect();
    logger.info('Redis connected successfully');

    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('Database connected successfully');

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`Authentication Service started on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close database connections
          await pool.end();
          logger.info('Database connections closed');
          
          // Close Redis connection
          await redisManager.disconnect();
          logger.info('Redis connection closed');
          
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error: (error as Error).message });
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

// Start the server
startServer();