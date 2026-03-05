"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictRateLimit = exports.generalRateLimit = exports.authRateLimit = exports.createRateLimit = void 0;
const cache_service_1 = require("../services/cache.service");
const logger_1 = require("../utils/logger");
const createRateLimit = (options) => {
    const { windowMs, maxRequests, keyGenerator = (req) => req.ip || 'unknown', skipSuccessfulRequests = false, skipFailedRequests = false } = options;
    return async (req, res, next) => {
        try {
            const key = keyGenerator(req);
            const windowSeconds = Math.floor(windowMs / 1000);
            // Get current count
            const current = await cache_service_1.cacheService.incrementRateLimit(key, windowSeconds);
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
                logger_1.logger.warn('Rate limit exceeded', {
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
            res.send = function (body) {
                const statusCode = res.statusCode;
                const shouldSkip = (skipSuccessfulRequests && statusCode < 400) ||
                    (skipFailedRequests && statusCode >= 400);
                if (shouldSkip) {
                    // Decrement the counter since we're skipping this request
                    cache_service_1.cacheService.incrementRateLimit(key, windowSeconds).then(count => {
                        if (count > 1) {
                            // Only decrement if count is greater than 1 to avoid going negative
                            cache_service_1.cacheService.set(`rate_limit:${key}`, count - 1, windowSeconds);
                        }
                    }).catch(error => {
                        logger_1.logger.error('Failed to adjust rate limit counter', { error: error.message });
                    });
                }
                return originalSend.call(this, body);
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('Rate limit middleware error', { error: error.message });
            next(); // Continue without rate limiting on error
        }
    };
};
exports.createRateLimit = createRateLimit;
// Predefined rate limiters
exports.authRateLimit = (0, exports.createRateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    keyGenerator: (req) => `auth:${req.ip || 'unknown'}:${req.body?.email || 'unknown'}`,
    skipSuccessfulRequests: true
});
exports.generalRateLimit = (0, exports.createRateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    keyGenerator: (req) => `general:${req.ip || 'unknown'}`
});
exports.strictRateLimit = (0, exports.createRateLimit)({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    keyGenerator: (req) => `strict:${req.ip || 'unknown'}`
});
//# sourceMappingURL=rateLimit.middleware.js.map