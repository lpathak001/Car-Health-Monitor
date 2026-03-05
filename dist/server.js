"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const logger_1 = require("./utils/logger");
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
        // Initialize Redis connection
        await redis_1.redisManager.connect();
        logger_1.logger.info('Redis connected successfully');
        // Test database connection
        await database_1.pool.query('SELECT NOW()');
        logger_1.logger.info('Database connected successfully');
        // Start the server
        const server = app_1.default.listen(PORT, () => {
            logger_1.logger.info(`Authentication Service started on port ${PORT}`, {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                nodeVersion: process.version
            });
        });
        // Graceful shutdown handling
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}, starting graceful shutdown...`);
            server.close(async () => {
                logger_1.logger.info('HTTP server closed');
                try {
                    // Close database connections
                    await database_1.pool.end();
                    logger_1.logger.info('Database connections closed');
                    // Close Redis connection
                    await redis_1.redisManager.disconnect();
                    logger_1.logger.info('Redis connection closed');
                    logger_1.logger.info('Graceful shutdown completed');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.logger.error('Error during graceful shutdown', { error: error.message });
                    process.exit(1);
                }
            });
        };
        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
            process.exit(1);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Rejection', { reason, promise });
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', { error: error.message });
        process.exit(1);
    }
}
// Start the server
startServer();
//# sourceMappingURL=server.js.map