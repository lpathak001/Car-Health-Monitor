import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const createRateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const windowSeconds = Math.floor(windowMs / 1000);
      
      // Get current count
      const current = await cacheService.incrementRateLimit(key, windowSeconds);
      
      // Calculate remaining requests
      const remaining = Math.max(0, maxRequests - current);
      const resetTime = new Date(Date.now() + windowMs);

      // Add rate limit info to request
      req.rateLimitInfo = {
        limit: maxRequests,
        current,
        remaining,
        resetTime
      };

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.floor(resetTime.getTime() / 1000).toString()
      });

      // Check if limit exceeded
      if (current > maxRequests) {
        logger.warn('Rate limit exceeded', {
          key,
          current,
          limit: maxRequests,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(429).json({
          error: 'rate_limit_exceeded',
          message: 'Too many requests, please try again later',
          retryAfter: Math.floor(windowMs / 1000)
        });
      }

      // Handle response to potentially skip counting
      const originalSend = res.send;
      res.send = function(body) {
        const statusCode = res.statusCode;
        const shouldSkip = 
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400);

        if (shouldSkip) {
          // Decrement the counter since we're skipping this request
          cacheService.incrementRateLimit(key, windowSeconds).then(count => {
            if (count > 1) {
              // Only decrement if count is greater than 1 to avoid going negative
              cacheService.set(`rate_limit:${key}`, count - 1, windowSeconds);
            }
          }).catch(error => {
            logger.error('Failed to adjust rate limit counter', { error: error.message });
          });
        }

        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Rate limit middleware error', { error: (error as Error).message });
      next(); // Continue without rate limiting on error
    }
  };
};

// Predefined rate limiters
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip || 'unknown'}:${req.body?.email || 'unknown'}`,
  skipSuccessfulRequests: true
});

export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  keyGenerator: (req) => `general:${req.ip || 'unknown'}`
});

export const strictRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  keyGenerator: (req) => `strict:${req.ip || 'unknown'}`
});