import { RedisClientType } from 'redis';
import { redisManager } from '../config/redis';
import { logger } from '../utils/logger';

export class CacheService {
  private client: RedisClientType;
  private defaultTTL = 900; // 15 minutes

  constructor() {
    this.client = redisManager.getClient();
  }

  // User Profile Caching
  async cacheUserProfile(userId: string, profile: any): Promise<void> {
    try {
      const key = `user:profile:${userId}`;
      await this.client.setEx(key, 900, JSON.stringify(profile)); // 15 min TTL
      logger.debug('User profile cached', { userId });
    } catch (error) {
      logger.error('Failed to cache user profile', { 
        userId, 
        error: (error as Error).message 
      });
    }
  }

  async getUserProfile(userId: string): Promise<any | null> {
    try {
      const key = `user:profile:${userId}`;
      const cached = await this.client.get(key);
      if (cached) {
        logger.debug('User profile cache hit', { userId });
        return JSON.parse(cached);
      }
      logger.debug('User profile cache miss', { userId });
      return null;
    } catch (error) {
      logger.error('Failed to get cached user profile', { 
        userId, 
        error: (error as Error).message 
      });
      return null;
    }
  }

  // Rate Limiting Cache
  async incrementRateLimit(identifier: string, windowSeconds: number): Promise<number> {
    try {
      const key = `rate_limit:${identifier}`;
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, windowSeconds);
      }
      
      return current;
    } catch (error) {
      logger.error('Failed to increment rate limit', { 
        identifier, 
        error: (error as Error).message 
      });
      return 0;
    }
  }

  async getRateLimit(identifier: string): Promise<number> {
    try {
      const key = `rate_limit:${identifier}`;
      const current = await this.client.get(key);
      return current ? parseInt(current) : 0;
    } catch (error) {
      logger.error('Failed to get rate limit', { 
        identifier, 
        error: (error as Error).message 
      });
      return 0;
    }
  }

  // Token Blacklist Cache
  async blacklistToken(tokenId: string, expiresAt: Date): Promise<void> {
    try {
      const key = `blacklist:token:${tokenId}`;
      const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      
      if (ttl > 0) {
        await this.client.setEx(key, ttl, 'blacklisted');
        logger.debug('Token blacklisted', { tokenId });
      }
    } catch (error) {
      logger.error('Failed to blacklist token', { 
        tokenId, 
        error: (error as Error).message 
      });
    }
  }

  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    try {
      const key = `blacklist:token:${tokenId}`;
      const result = await this.client.get(key);
      return result === 'blacklisted';
    } catch (error) {
      logger.error('Failed to check token blacklist', { 
        tokenId, 
        error: (error as Error).message 
      });
      return false;
    }
  }

  // Session Caching
  async cacheSession(sessionId: string, sessionData: any, ttlSeconds: number): Promise<void> {
    try {
      const key = `session:${sessionId}`;
      await this.client.setEx(key, ttlSeconds, JSON.stringify(sessionData));
      logger.debug('Session cached', { sessionId });
    } catch (error) {
      logger.error('Failed to cache session', { 
        sessionId, 
        error: (error as Error).message 
      });
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    try {
      const key = `session:${sessionId}`;
      const cached = await this.client.get(key);
      if (cached) {
        logger.debug('Session cache hit', { sessionId });
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get cached session', { 
        sessionId, 
        error: (error as Error).message 
      });
      return null;
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    try {
      const key = `session:${sessionId}`;
      await this.client.del(key);
      logger.debug('Session invalidated', { sessionId });
    } catch (error) {
      logger.error('Failed to invalidate session', { 
        sessionId, 
        error: (error as Error).message 
      });
    }
  }

  // Generic cache operations
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      logger.error('Failed to set cache value', { 
        key, 
        error: (error as Error).message 
      });
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Failed to get cache value', { 
        key, 
        error: (error as Error).message 
      });
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Failed to delete cache value', { 
        key, 
        error: (error as Error).message 
      });
    }
  }
}

export const cacheService = new CacheService();