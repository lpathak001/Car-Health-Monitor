import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class RedisManager {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries >= 5) {
            logger.error('Max Redis reconnection attempts reached');
            return false;
          }
          
          const delay = Math.min(retries * 1000, 5000);
          logger.info(`Reconnecting to Redis in ${delay}ms`, { attempt: retries + 1 });
          return delay;
        }
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', { error: error.message });
      this.isConnected = false;
    });

    this.client.on('disconnect', () => {
      logger.warn('Redis client disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: (error as Error).message });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      this.isConnected = false;
    } catch (error) {
      logger.error('Failed to disconnect from Redis', { error: (error as Error).message });
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed', { error: (error as Error).message });
      return false;
    }
  }
}

export const redisManager = new RedisManager();
export default redisManager;