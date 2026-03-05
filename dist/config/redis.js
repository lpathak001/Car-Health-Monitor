"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisManager = void 0;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
class RedisManager {
    constructor() {
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries >= 5) {
                        logger_1.logger.error('Max Redis reconnection attempts reached');
                        return false;
                    }
                    const delay = Math.min(retries * 1000, 5000);
                    logger_1.logger.info(`Reconnecting to Redis in ${delay}ms`, { attempt: retries + 1 });
                    return delay;
                }
            }
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger_1.logger.info('Redis client connected');
            this.isConnected = true;
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('Redis client error', { error: error.message });
            this.isConnected = false;
        });
        this.client.on('disconnect', () => {
            logger_1.logger.warn('Redis client disconnected');
            this.isConnected = false;
        });
    }
    async connect() {
        try {
            await this.client.connect();
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Redis', { error: error.message });
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.client.disconnect();
            this.isConnected = false;
        }
        catch (error) {
            logger_1.logger.error('Failed to disconnect from Redis', { error: error.message });
        }
    }
    getClient() {
        return this.client;
    }
    isHealthy() {
        return this.isConnected;
    }
    async ping() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('Redis ping failed', { error: error.message });
            return false;
        }
    }
}
exports.redisManager = new RedisManager();
exports.default = exports.redisManager;
//# sourceMappingURL=redis.js.map