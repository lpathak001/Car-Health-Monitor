"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Liveness probe - Is the service running?
router.get('/liveness', async (req, res) => {
    const start = Date.now();
    try {
        // Basic service health - memory, CPU, etc.
        const memoryUsage = process.memoryUsage();
        const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        if (memoryUsagePercent > 90) {
            return res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                duration: Date.now() - start,
                details: { memoryUsagePercent, reason: 'High memory usage' }
            });
        }
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            duration: Date.now() - start,
            details: { memoryUsagePercent }
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            duration: Date.now() - start,
            details: { error: error.message }
        });
    }
});
// Readiness probe - Can the service handle requests?
router.get('/readiness', async (req, res) => {
    const start = Date.now();
    try {
        // Check database connectivity
        await database_1.pool.query('SELECT 1');
        // Check Redis connectivity (optional)
        let redisHealthy = true;
        try {
            await redis_1.redisManager.ping();
        }
        catch (redisError) {
            redisHealthy = false;
            logger_1.logger.warn('Redis health check failed', { error: redisError.message });
        }
        const status = redisHealthy ? 'healthy' : 'degraded';
        const statusCode = redisHealthy ? 200 : 200; // Still ready even if Redis is down
        res.status(statusCode).json({
            status,
            timestamp: new Date().toISOString(),
            duration: Date.now() - start,
            details: {
                database: 'healthy',
                redis: redisHealthy ? 'healthy' : 'unhealthy'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Readiness check failed', { error: error.message });
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            duration: Date.now() - start,
            details: { error: error.message }
        });
    }
});
// Startup probe - Is the service ready to start?
router.get('/startup', async (req, res) => {
    const start = Date.now();
    try {
        // Check if all required environment variables are set
        const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'JWT_SECRET'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            return res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                duration: Date.now() - start,
                details: { missingEnvVars: missingVars }
            });
        }
        // Test database connection
        await database_1.pool.query('SELECT 1');
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            duration: Date.now() - start,
            details: { configuration: 'valid', database: 'connected' }
        });
    }
    catch (error) {
        logger_1.logger.error('Startup check failed', { error: error.message });
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            duration: Date.now() - start,
            details: { error: error.message }
        });
    }
});
// Comprehensive health check
router.get('/', async (req, res) => {
    const startTime = Date.now();
    try {
        // Run all health checks
        const livenessCheck = await runHealthCheck('/health/liveness');
        const readinessCheck = await runHealthCheck('/health/readiness');
        const startupCheck = await runHealthCheck('/health/startup');
        // Determine overall status
        const checks = [livenessCheck, readinessCheck, startupCheck];
        const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
        const hasDegraded = checks.some(check => check.status === 'degraded');
        let overallStatus = 'healthy';
        if (hasUnhealthy) {
            overallStatus = 'unhealthy';
        }
        else if (hasDegraded) {
            overallStatus = 'degraded';
        }
        const systemHealth = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            uptime: process.uptime(),
            checks: {
                liveness: livenessCheck,
                readiness: readinessCheck,
                startup: startupCheck
            }
        };
        const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
        res.status(statusCode).json(systemHealth);
    }
    catch (error) {
        logger_1.logger.error('Health check failed', { error: error.message });
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            uptime: process.uptime(),
            error: error.message,
            duration: Date.now() - startTime
        });
    }
});
// Helper function to run individual health checks
async function runHealthCheck(endpoint) {
    const start = Date.now();
    try {
        // This is a simplified version - in a real implementation,
        // you might make HTTP requests to the actual endpoints
        switch (endpoint) {
            case '/health/liveness':
                const memoryUsage = process.memoryUsage();
                const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
                return {
                    status: memoryUsagePercent > 90 ? 'unhealthy' : 'healthy',
                    timestamp: new Date().toISOString(),
                    duration: Date.now() - start,
                    details: { memoryUsagePercent }
                };
            case '/health/readiness':
                await database_1.pool.query('SELECT 1');
                const redisHealthy = await redis_1.redisManager.ping();
                return {
                    status: redisHealthy ? 'healthy' : 'degraded',
                    timestamp: new Date().toISOString(),
                    duration: Date.now() - start,
                    details: { database: 'healthy', redis: redisHealthy ? 'healthy' : 'unhealthy' }
                };
            case '/health/startup':
                const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'JWT_SECRET'];
                const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
                if (missingVars.length > 0) {
                    return {
                        status: 'unhealthy',
                        timestamp: new Date().toISOString(),
                        duration: Date.now() - start,
                        details: { missingEnvVars: missingVars }
                    };
                }
                await database_1.pool.query('SELECT 1');
                return {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    duration: Date.now() - start,
                    details: { configuration: 'valid', database: 'connected' }
                };
            default:
                throw new Error(`Unknown health check endpoint: ${endpoint}`);
        }
    }
    catch (error) {
        return {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            duration: Date.now() - start,
            details: { error: error.message }
        };
    }
}
exports.default = router;
//# sourceMappingURL=health.routes.js.map