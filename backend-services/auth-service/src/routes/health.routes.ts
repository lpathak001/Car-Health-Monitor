import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { redisManager } from '../config/redis';
import { logger } from '../utils/logger';

const router = Router();

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  duration: number;
  details?: any;
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    liveness: HealthCheckResult;
    readiness: HealthCheckResult;
    startup: HealthCheckResult;
  };
}

// Liveness probe - Is the service running?
router.get('/liveness', async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      duration: Date.now() - start,
      details: { error: (error as Error).message }
    });
  }
});

// Readiness probe - Can the service handle requests?
router.get('/readiness', async (req: Request, res: Response) => {
  const start = Date.now();
  
  try {
    // Check database connectivity
    await pool.query('SELECT 1');
    
    // Check Redis connectivity (optional)
    let redisHealthy = true;
    try {
      await redisManager.ping();
    } catch (redisError) {
      redisHealthy = false;
      logger.warn('Redis health check failed', { error: (redisError as Error).message });
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
  } catch (error) {
    logger.error('Readiness check failed', { error: (error as Error).message });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      duration: Date.now() - start,
      details: { error: (error as Error).message }
    });
  }
});

// Startup probe - Is the service ready to start?
router.get('/startup', async (req: Request, res: Response) => {
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
    await pool.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      duration: Date.now() - start,
      details: { configuration: 'valid', database: 'connected' }
    });
  } catch (error) {
    logger.error('Startup check failed', { error: (error as Error).message });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      duration: Date.now() - start,
      details: { error: (error as Error).message }
    });
  }
});

// Comprehensive health check
router.get('/', async (req: Request, res: Response) => {
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
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }
    
    const systemHealth: SystemHealth = {
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
  } catch (error) {
    logger.error('Health check failed', { error: (error as Error).message });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      error: (error as Error).message,
      duration: Date.now() - startTime
    });
  }
});

// Helper function to run individual health checks
async function runHealthCheck(endpoint: string): Promise<HealthCheckResult> {
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
        await pool.query('SELECT 1');
        const redisHealthy = await redisManager.ping();
        
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
        
        await pool.query('SELECT 1');
        
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          duration: Date.now() - start,
          details: { configuration: 'valid', database: 'connected' }
        };
        
      default:
        throw new Error(`Unknown health check endpoint: ${endpoint}`);
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      duration: Date.now() - start,
      details: { error: (error as Error).message }
    };
  }
}

export default router;