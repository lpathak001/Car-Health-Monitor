"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
class CacheService {
    constructor() {
        this.defaultTTL = 900; // 15 minutes
        this.client = redis_1.redisManager.getClient();
    }
    // User Profile Caching
    async cacheUserProfile(userId, profile) {
        try {
            const key = `user:profile:${userId}`;
            await this.client.setEx(key, 900, JSON.stringify(profile)); // 15 min TTL
            logger_1.logger.debug('User profile cached', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to cache user profile', {
                userId,
                error: error.message
            });
        }
    }
    async getUserProfile(userId) {
        try {
            const key = `user:profile:${userId}`;
            const cached = await this.client.get(key);
            if (cached) {
                logger_1.logger.debug('User profile cache hit', { userId });
                return JSON.parse(cached);
            }
            logger_1.logger.debug('User profile cache miss', { userId });
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get cached user profile', {
                userId,
                error: error.message
            });
            return null;
        }
    }
    // Rate Limiting Cache
    async incrementRateLimit(identifier, windowSeconds) {
        try {
            const key = `rate_limit:${identifier}`;
            const current = await this.client.incr(key);
            if (current === 1) {
                await this.client.expire(key, windowSeconds);
            }
            return current;
        }
        catch (error) {
            logger_1.logger.error('Failed to increment rate limit', {
                identifier,
                error: error.message
            });
            return 0;
        }
    }
    async getRateLimit(identifier) {
        try {
            const key = `rate_limit:${identifier}`;
            const current = await this.client.get(key);
            return current ? parseInt(current) : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to get rate limit', {
                identifier,
                error: error.message
            });
            return 0;
        }
    }
    // Token Blacklist Cache
    async blacklistToken(tokenId, expiresAt) {
        try {
            const key = `blacklist:token:${tokenId}`;
            const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
            if (ttl > 0) {
                await this.client.setEx(key, ttl, 'blacklisted');
                logger_1.logger.debug('Token blacklisted', { tokenId });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to blacklist token', {
                tokenId,
                error: error.message
            });
        }
    }
    async isTokenBlacklisted(tokenId) {
        try {
            const key = `blacklist:token:${tokenId}`;
            const result = await this.client.get(key);
            return result === 'blacklisted';
        }
        catch (error) {
            logger_1.logger.error('Failed to check token blacklist', {
                tokenId,
                error: error.message
            });
            return false;
        }
    }
    // Session Caching
    async cacheSession(sessionId, sessionData, ttlSeconds) {
        try {
            const key = `session:${sessionId}`;
            await this.client.setEx(key, ttlSeconds, JSON.stringify(sessionData));
            logger_1.logger.debug('Session cached', { sessionId });
        }
        catch (error) {
            logger_1.logger.error('Failed to cache session', {
                sessionId,
                error: error.message
            });
        }
    }
    async getSession(sessionId) {
        try {
            const key = `session:${sessionId}`;
            const cached = await this.client.get(key);
            if (cached) {
                logger_1.logger.debug('Session cache hit', { sessionId });
                return JSON.parse(cached);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get cached session', {
                sessionId,
                error: error.message
            });
            return null;
        }
    }
    async invalidateSession(sessionId) {
        try {
            const key = `session:${sessionId}`;
            await this.client.del(key);
            logger_1.logger.debug('Session invalidated', { sessionId });
        }
        catch (error) {
            logger_1.logger.error('Failed to invalidate session', {
                sessionId,
                error: error.message
            });
        }
    }
    // Generic cache operations
    async set(key, value, ttlSeconds) {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, serialized);
            }
            else {
                await this.client.set(key, serialized);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to set cache value', {
                key,
                error: error.message
            });
        }
    }
    async get(key) {
        try {
            const cached = await this.client.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get cache value', {
                key,
                error: error.message
            });
            return null;
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete cache value', {
                key,
                error: error.message
            });
        }
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
//# sourceMappingURL=cache.service.js.map