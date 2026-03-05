# Authentication Service - NFR Design Patterns

## Resilience Patterns

### Circuit Breaker Pattern

#### Implementation: Library-Based Circuit Breakers (Opossum)
```typescript
import CircuitBreaker from 'opossum';

// Database Circuit Breaker Configuration
const dbCircuitBreakerOptions = {
  timeout: 10000,           // 10 second timeout
  errorThresholdPercentage: 50,  // Open circuit at 50% error rate
  resetTimeout: 30000,      // Try again after 30 seconds
  rollingCountTimeout: 60000,    // 1 minute rolling window
  rollingCountBuckets: 10,  // 10 buckets in rolling window
  name: 'DatabaseCircuitBreaker',
  group: 'authentication-service'
};

const databaseCircuitBreaker = new CircuitBreaker(
  async (query: string, params: any[]) => {
    return await pgPool.query(query, params);
  },
  dbCircuitBreakerOptions
);

// Redis Circuit Breaker Configuration
const redisCircuitBreakerOptions = {
  timeout: 5000,            // 5 second timeout
  errorThresholdPercentage: 60,  // Open circuit at 60% error rate
  resetTimeout: 15000,      // Try again after 15 seconds
  name: 'RedisCircuitBreaker',
  fallback: () => null     // Return null when Redis unavailable
};

const redisCircuitBreaker = new CircuitBreaker(
  async (operation: () => Promise<any>) => {
    return await operation();
  },
  redisCircuitBreakerOptions
);
```

#### Circuit Breaker Event Handling
```typescript
// Database Circuit Breaker Events
databaseCircuitBreaker.on('open', () => {
  logger.error('Database circuit breaker opened - database unavailable');
  // Trigger alert to operations team
});

databaseCircuitBreaker.on('halfOpen', () => {
  logger.info('Database circuit breaker half-open - testing connection');
});

databaseCircuitBreaker.on('close', () => {
  logger.info('Database circuit breaker closed - database connection restored');
});

// Fallback Strategy for Database Failures
databaseCircuitBreaker.fallback(() => {
  throw new Error('Database temporarily unavailable. Please try again later.');
});
```
### Database Connection Resilience Pattern

#### Connection Pool with Retry and Exponential Backoff
```typescript
import { Pool } from 'pg';

// Enhanced PostgreSQL Connection Pool Configuration
const pgPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  
  // Connection Pool Settings
  max: 20,                    // Maximum connections in pool
  min: 5,                     // Minimum connections to maintain
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 10000,  // Connection timeout
  
  // Retry Configuration
  application_name: 'auth-service',
  statement_timeout: 30000,   // Query timeout
  query_timeout: 30000,       // Query timeout
  
  // Connection Validation
  allowExitOnIdle: true
});

// Exponential Backoff Retry Logic
class DatabaseRetryHandler {
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second
  private maxDelay = 10000; // 10 seconds

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.maxRetries) {
          logger.error(`Database operation failed after ${this.maxRetries} attempts`, {
            context,
            error: lastError.message,
            attempts: attempt
          });
          throw lastError;
        }
        
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt - 1),
          this.maxDelay
        );
        
        logger.warn(`Database operation failed, retrying in ${delay}ms`, {
          context,
          attempt,
          error: lastError.message
        });
        
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const dbRetryHandler = new DatabaseRetryHandler();
```

### Layered Health Check Pattern

#### Comprehensive Health Check Implementation
```typescript
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

class HealthCheckService {
  // Liveness Probe - Is the service running?
  async livenessCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // Basic service health - memory, CPU, etc.
      const memoryUsage = process.memoryUsage();
      const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      if (memoryUsagePercent > 90) {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          duration: Date.now() - start,
          details: { memoryUsagePercent, reason: 'High memory usage' }
        };
      }
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
        details: { memoryUsagePercent }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
        details: { error: (error as Error).message }
      };
    }
  }
  
  // Readiness Probe - Can the service handle requests?
  async readinessCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // Check database connectivity
      await pgPool.query('SELECT 1');
      
      // Check Redis connectivity (optional)
      try {
        await redisClient.ping();
      } catch (redisError) {
        // Redis failure is degraded, not unhealthy
        return {
          status: 'degraded',
          timestamp: new Date().toISOString(),
          duration: Date.now() - start,
          details: { database: 'healthy', redis: 'unhealthy' }
        };
      }
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
        details: { database: 'healthy', redis: 'healthy' }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
        details: { error: (error as Error).message }
      };
    }
  }
  
  // Startup Probe - Is the service ready to start?
  async startupCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // Check if all required environment variables are set
      const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'JWT_SECRET', 'REDIS_URL'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          duration: Date.now() - start,
          details: { missingEnvVars: missingVars }
        };
      }
      
      // Test database connection
      await pgPool.query('SELECT 1');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
        details: { configuration: 'valid', database: 'connected' }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        duration: Date.now() - start,
        details: { error: (error as Error).message }
      };
    }
  }
}
```

## Scalability Patterns

### Combined Metrics Auto-Scaling Pattern

#### ECS Auto-Scaling Configuration
```yaml
# ECS Service Auto-Scaling Policy
Resources:
  AuthServiceAutoScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      ServiceNamespace: ecs
      ResourceId: service/car-health-monitor-cluster/authentication-service
      ScalableDimension: ecs:service:DesiredCount
      MinCapacity: 2
      MaxCapacity: 10
      RoleARN: !GetAtt ApplicationAutoScalingECSRole.Arn

  # CPU-based Scaling Policy
  AuthServiceCPUScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: AuthServiceCPUScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref AuthServiceAutoScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        ScaleOutCooldown: 300  # 5 minutes
        ScaleInCooldown: 300   # 5 minutes

  # Memory-based Scaling Policy
  AuthServiceMemoryScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: AuthServiceMemoryScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref AuthServiceAutoScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 80.0
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageMemoryUtilization
        ScaleOutCooldown: 300
        ScaleInCooldown: 300
```

### Round-Robin Load Balancing Pattern

#### Application Load Balancer Configuration
```yaml
# Application Load Balancer
AuthServiceALB:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Name: auth-service-alb
    Scheme: internal
    Type: application
    Subnets:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
    SecurityGroups:
      - !Ref AuthServiceALBSecurityGroup

# Target Group with Health Checks
AuthServiceTargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    Name: auth-service-targets
    Port: 3000
    Protocol: HTTP
    VpcId: !Ref VPC
    TargetType: ip
    
    # Health Check Configuration
    HealthCheckEnabled: true
    HealthCheckPath: /health/readiness
    HealthCheckProtocol: HTTP
    HealthCheckIntervalSeconds: 30
    HealthCheckTimeoutSeconds: 10
    HealthyThresholdCount: 2
    UnhealthyThresholdCount: 3
    
    # Load Balancing Algorithm
    TargetGroupAttributes:
      - Key: load_balancing.algorithm.type
        Value: round_robin
      - Key: deregistration_delay.timeout_seconds
        Value: 30
      - Key: stickiness.enabled
        Value: false  # Stateless service
```

### Connection Pooling Optimization Pattern

#### Advanced Connection Pool Management
```typescript
class DatabaseConnectionManager {
  private pool: Pool;
  private metrics: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
  } = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingClients: 0
  };

  constructor() {
    this.pool = new Pool({
      // Dynamic connection pool sizing based on load
      max: this.calculateMaxConnections(),
      min: Math.max(2, Math.floor(this.calculateMaxConnections() * 0.25)),
      
      // Connection lifecycle management
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      
      // Connection validation
      allowExitOnIdle: true,
      
      // Performance optimization
      application_name: 'auth-service',
      statement_timeout: 30000
    });

    // Monitor pool metrics
    this.setupPoolMonitoring();
  }

  private calculateMaxConnections(): number {
    // Base connections + scaling factor based on expected load
    const baseConnections = 10;
    const expectedConcurrentUsers = parseInt(process.env.EXPECTED_CONCURRENT_USERS || '50');
    const connectionsPerUser = 0.2; // Conservative estimate
    
    return Math.min(
      baseConnections + Math.ceil(expectedConcurrentUsers * connectionsPerUser),
      50 // Maximum limit
    );
  }

  private setupPoolMonitoring(): void {
    setInterval(() => {
      this.metrics = {
        totalConnections: this.pool.totalCount,
        activeConnections: this.pool.totalCount - this.pool.idleCount,
        idleConnections: this.pool.idleCount,
        waitingClients: this.pool.waitingCount
      };

      // Log metrics for monitoring
      logger.info('Database connection pool metrics', this.metrics);

      // Alert if pool is under stress
      if (this.metrics.waitingClients > 5) {
        logger.warn('Database connection pool under stress', {
          waitingClients: this.metrics.waitingClients,
          totalConnections: this.metrics.totalConnections
        });
      }
    }, 60000); // Every minute
  }

  async query(text: string, params?: any[]): Promise<any> {
    return await dbRetryHandler.executeWithRetry(
      () => this.pool.query(text, params),
      `query: ${text.substring(0, 50)}...`
    );
  }

  getMetrics() {
    return this.metrics;
  }
}
```

## Performance Patterns

### Redis Caching Pattern

#### Strategic Caching Implementation
```typescript
interface CacheConfig {
  ttl: number;
  keyPrefix: string;
  serializer: 'json' | 'string';
}

class RedisCacheService {
  private client: RedisClientType;
  private defaultTTL = 900; // 15 minutes

  constructor(redisClient: RedisClientType) {
    this.client = redisClient;
  }

  // User Profile Caching
  async cacheUserProfile(userId: string, profile: any): Promise<void> {
    const key = `user:profile:${userId}`;
    await this.client.setEx(key, 900, JSON.stringify(profile)); // 15 min TTL
  }

  async getUserProfile(userId: string): Promise<any | null> {
    const key = `user:profile:${userId}`;
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Rate Limiting Cache
  async incrementRateLimit(identifier: string, windowSeconds: number): Promise<number> {
    const key = `rate_limit:${identifier}`;
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, windowSeconds);
    }
    
    return current;
  }

  // Token Blacklist Cache
  async blacklistToken(tokenId: string, expiresAt: Date): Promise<void> {
    const key = `blacklist:token:${tokenId}`;
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    
    if (ttl > 0) {
      await this.client.setEx(key, ttl, 'blacklisted');
    }
  }

  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    const key = `blacklist:token:${tokenId}`;
    const result = await this.client.get(key);
    return result === 'blacklisted';
  }

  // Session Caching
  async cacheSession(sessionId: string, sessionData: any, ttlSeconds: number): Promise<void> {
    const key = `session:${sessionId}`;
    await this.client.setEx(key, ttlSeconds, JSON.stringify(sessionData));
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.client.del(key);
  }
}
```

### Shared JWT Secret Validation Pattern

#### Optimized Token Validation
```typescript
import jwt from 'jsonwebtoken';

interface JWTValidationResult {
  valid: boolean;
  payload?: any;
  error?: string;
}

class JWTValidationService {
  private secret: string;
  private validationCache = new Map<string, { result: JWTValidationResult; expiry: number }>();
  private cacheCleanupInterval: NodeJS.Timeout;

  constructor() {
    this.secret = process.env.JWT_SECRET!;
    
    // Clean up expired cache entries every 5 minutes
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, 300000);
  }

  // Fast token validation with optional caching
  validateToken(token: string, useCache: boolean = true): JWTValidationResult {
    // Check cache first (for high-frequency validation)
    if (useCache) {
      const cached = this.validationCache.get(token);
      if (cached && cached.expiry > Date.now()) {
        return cached.result;
      }
    }

    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: 'car-health-monitor-auth',
        audience: 'car-health-monitor-services',
        clockTolerance: 30 // 30 seconds clock skew tolerance
      });

      const result: JWTValidationResult = {
        valid: true,
        payload
      };

      // Cache successful validation for 1 minute
      if (useCache) {
        this.validationCache.set(token, {
          result,
          expiry: Date.now() + 60000
        });
      }

      return result;
    } catch (error) {
      const result: JWTValidationResult = {
        valid: false,
        error: (error as Error).message
      };

      // Don't cache failures (they might be temporary)
      return result;
    }
  }

  // Express middleware for token validation
  createAuthMiddleware() {
    return (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'authentication_required',
          message: 'Authorization header required'
        });
      }

      const token = authHeader.substring(7);
      const validation = this.validateToken(token);

      if (!validation.valid) {
        return res.status(401).json({
          error: 'invalid_token',
          message: 'Invalid or expired token'
        });
      }

      // Add user context to request
      req.user = validation.payload;
      next();
    };
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [token, cached] of this.validationCache.entries()) {
      if (cached.expiry <= now) {
        this.validationCache.delete(token);
      }
    }
  }

  destroy(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.validationCache.clear();
  }
}
```
### Comprehensive Database Optimization Pattern

#### Multi-Layered Database Performance Strategy
```typescript
// Database Query Optimization Service
class DatabaseOptimizationService {
  private pool: Pool;
  private queryMetrics = new Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    slowQueries: number;
  }>();

  constructor(pool: Pool) {
    this.pool = pool;
    this.setupQueryMonitoring();
  }

  // Optimized query execution with monitoring
  async executeQuery(
    name: string,
    text: string,
    params?: any[]
  ): Promise<any> {
    const start = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      this.recordQueryMetrics(name, duration);
      
      // Log slow queries for optimization
      if (duration > 1000) { // Queries taking more than 1 second
        logger.warn('Slow query detected', {
          queryName: name,
          duration,
          query: text.substring(0, 100)
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordQueryMetrics(name, duration, true);
      throw error;
    }
  }

  // Prepared statement cache for frequently used queries
  private preparedStatements = new Map<string, string>();

  async executePreparedQuery(
    name: string,
    text: string,
    params?: any[]
  ): Promise<any> {
    if (!this.preparedStatements.has(name)) {
      this.preparedStatements.set(name, text);
    }
    
    return this.executeQuery(name, text, params);
  }

  private recordQueryMetrics(name: string, duration: number, isError: boolean = false): void {
    const existing = this.queryMetrics.get(name) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      slowQueries: 0
    };

    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    
    if (duration > 1000) {
      existing.slowQueries++;
    }

    this.queryMetrics.set(name, existing);
  }

  private setupQueryMonitoring(): void {
    // Report query metrics every 5 minutes
    setInterval(() => {
      for (const [queryName, metrics] of this.queryMetrics.entries()) {
        if (metrics.count > 0) {
          logger.info('Query performance metrics', {
            queryName,
            ...metrics
          });
        }
      }
      
      // Reset metrics for next interval
      this.queryMetrics.clear();
    }, 300000);
  }

  // Database index monitoring
  async analyzeQueryPerformance(): Promise<void> {
    try {
      // Check for missing indexes
      const missingIndexes = await this.pool.query(`
        SELECT schemaname, tablename, attname, n_distinct, correlation
        FROM pg_stats
        WHERE schemaname = 'public'
        AND n_distinct > 100
        AND correlation < 0.1
      `);

      if (missingIndexes.rows.length > 0) {
        logger.info('Potential missing indexes detected', {
          tables: missingIndexes.rows
        });
      }

      // Check for unused indexes
      const unusedIndexes = await this.pool.query(`
        SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE idx_tup_read = 0
        AND idx_tup_fetch = 0
      `);

      if (unusedIndexes.rows.length > 0) {
        logger.info('Unused indexes detected', {
          indexes: unusedIndexes.rows
        });
      }
    } catch (error) {
      logger.error('Failed to analyze query performance', {
        error: (error as Error).message
      });
    }
  }
}

// Essential Database Indexes
const createOptimalIndexes = async (pool: Pool): Promise<void> => {
  const indexes = [
    // User table indexes
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status ON users(status)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)',
    
    // Refresh token indexes
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)',
    
    // Authentication log indexes
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_logs_user_id ON authentication_logs(user_id)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_logs_email ON authentication_logs(email)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_logs_created_at ON authentication_logs(created_at)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_logs_event_type ON authentication_logs(event_type)',
    
    // Composite indexes for common queries
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_status ON users(email, status)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_user_expires ON refresh_tokens(user_id, expires_at)'
  ];

  for (const indexQuery of indexes) {
    try {
      await pool.query(indexQuery);
      logger.info('Database index created', { query: indexQuery });
    } catch (error) {
      logger.error('Failed to create database index', {
        query: indexQuery,
        error: (error as Error).message
      });
    }
  }
};
```

## Security Patterns

### AWS Secrets Manager Auto-Rotation Pattern

#### Automated Key Management
```typescript
import { SecretsManagerClient, GetSecretValueCommand, UpdateSecretCommand } from '@aws-sdk/client-secrets-manager';

class SecretManager {
  private client: SecretsManagerClient;
  private secretCache = new Map<string, { value: string; expiry: number }>();

  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  // Get secret with caching
  async getSecret(secretName: string, cacheTTL: number = 300000): Promise<string> {
    // Check cache first
    const cached = this.secretCache.get(secretName);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: 'AWSCURRENT'
      });

      const response = await this.client.send(command);
      const secretValue = response.SecretString!;

      // Cache the secret
      this.secretCache.set(secretName, {
        value: secretValue,
        expiry: Date.now() + cacheTTL
      });

      return secretValue;
    } catch (error) {
      logger.error('Failed to retrieve secret', {
        secretName,
        error: (error as Error).message
      });
      throw error;
    }
  }

  // JWT Secret with automatic rotation support
  async getJWTSecret(): Promise<string> {
    return await this.getSecret('car-health-monitor/auth/jwt-secret');
  }

  // Database password with rotation
  async getDBPassword(): Promise<string> {
    return await this.getSecret('car-health-monitor/auth/db-password');
  }

  // Clear cache when secrets are rotated
  clearSecretCache(secretName?: string): void {
    if (secretName) {
      this.secretCache.delete(secretName);
    } else {
      this.secretCache.clear();
    }
  }
}

// JWT Service with rotation support
class JWTServiceWithRotation {
  private secretManager: SecretManager;
  private currentSecret: string | null = null;
  private previousSecret: string | null = null;
  private secretRefreshInterval: NodeJS.Timeout;

  constructor(secretManager: SecretManager) {
    this.secretManager = secretManager;
    
    // Refresh secrets every hour
    this.secretRefreshInterval = setInterval(async () => {
      await this.refreshSecrets();
    }, 3600000);
    
    // Initial secret load
    this.refreshSecrets();
  }

  private async refreshSecrets(): Promise<void> {
    try {
      const newSecret = await this.secretManager.getJWTSecret();
      
      if (newSecret !== this.currentSecret) {
        this.previousSecret = this.currentSecret;
        this.currentSecret = newSecret;
        
        logger.info('JWT secret rotated');
      }
    } catch (error) {
      logger.error('Failed to refresh JWT secret', {
        error: (error as Error).message
      });
    }
  }

  // Generate tokens with current secret
  generateToken(payload: any): string {
    if (!this.currentSecret) {
      throw new Error('JWT secret not available');
    }

    return jwt.sign(payload, this.currentSecret, {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: 'car-health-monitor-auth',
      audience: 'car-health-monitor-services'
    });
  }

  // Validate tokens with current and previous secrets (for rotation period)
  validateToken(token: string): JWTValidationResult {
    // Try current secret first
    if (this.currentSecret) {
      try {
        const payload = jwt.verify(token, this.currentSecret, {
          algorithms: ['HS256'],
          issuer: 'car-health-monitor-auth',
          audience: 'car-health-monitor-services'
        });
        
        return { valid: true, payload };
      } catch (error) {
        // Continue to try previous secret
      }
    }

    // Try previous secret (during rotation period)
    if (this.previousSecret) {
      try {
        const payload = jwt.verify(token, this.previousSecret, {
          algorithms: ['HS256'],
          issuer: 'car-health-monitor-auth',
          audience: 'car-health-monitor-services'
        });
        
        logger.info('Token validated with previous secret (rotation period)');
        return { valid: true, payload };
      } catch (error) {
        // Token is invalid
      }
    }

    return {
      valid: false,
      error: 'Invalid or expired token'
    };
  }

  destroy(): void {
    if (this.secretRefreshInterval) {
      clearInterval(this.secretRefreshInterval);
    }
  }
}
```

### Real-Time Security Event Monitoring Pattern

#### CloudWatch Security Event Streaming
```typescript
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

interface SecurityEvent {
  type: 'login_failure' | 'account_lockout' | 'suspicious_activity' | 'token_abuse' | 'brute_force';
  userId?: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

class SecurityEventMonitor {
  private cloudWatch: CloudWatchClient;
  private eventBuffer: SecurityEvent[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    this.cloudWatch = new CloudWatchClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });

    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 30000);
  }

  // Record security event
  recordSecurityEvent(event: SecurityEvent): void {
    // Log immediately
    logger.warn('Security event detected', {
      type: event.type,
      severity: event.severity,
      email: event.email,
      ipAddress: event.ipAddress,
      details: event.details
    });

    // Add to buffer for CloudWatch metrics
    this.eventBuffer.push(event);

    // Send immediate alert for critical events
    if (event.severity === 'critical') {
      this.sendImmediateAlert(event);
    }
  }

  // Detect brute force attacks
  private bruteForceAttempts = new Map<string, { count: number; firstAttempt: Date }>();

  checkBruteForceAttack(email: string, ipAddress: string): boolean {
    const key = `${email}:${ipAddress}`;
    const now = new Date();
    const existing = this.bruteForceAttempts.get(key);

    if (!existing) {
      this.bruteForceAttempts.set(key, { count: 1, firstAttempt: now });
      return false;
    }

    // Reset counter if more than 1 hour has passed
    if (now.getTime() - existing.firstAttempt.getTime() > 3600000) {
      this.bruteForceAttempts.set(key, { count: 1, firstAttempt: now });
      return false;
    }

    existing.count++;

    // Trigger brute force detection after 10 attempts in 1 hour
    if (existing.count >= 10) {
      this.recordSecurityEvent({
        type: 'brute_force',
        email,
        ipAddress,
        userAgent: 'unknown',
        details: { attemptCount: existing.count, timeWindow: '1 hour' },
        severity: 'high',
        timestamp: now
      });

      return true;
    }

    return false;
  }

  // Flush events to CloudWatch
  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const metricData = this.eventBuffer.map(event => ({
        MetricName: `SecurityEvent_${event.type}`,
        Value: 1,
        Unit: 'Count',
        Timestamp: event.timestamp,
        Dimensions: [
          { Name: 'Severity', Value: event.severity },
          { Name: 'Service', Value: 'authentication-service' }
        ]
      }));

      const command = new PutMetricDataCommand({
        Namespace: 'CarHealthMonitor/Security',
        MetricData: metricData
      });

      await this.cloudWatch.send(command);
      
      logger.info('Security events sent to CloudWatch', {
        eventCount: this.eventBuffer.length
      });

      // Clear buffer
      this.eventBuffer = [];
    } catch (error) {
      logger.error('Failed to send security events to CloudWatch', {
        error: (error as Error).message,
        eventCount: this.eventBuffer.length
      });
    }
  }

  private async sendImmediateAlert(event: SecurityEvent): Promise<void> {
    // In a real implementation, this would send to SNS, Slack, PagerDuty, etc.
    logger.error('CRITICAL SECURITY EVENT', {
      type: event.type,
      email: event.email,
      ipAddress: event.ipAddress,
      details: event.details,
      timestamp: event.timestamp
    });

    // Send CloudWatch alarm immediately
    try {
      const command = new PutMetricDataCommand({
        Namespace: 'CarHealthMonitor/Security/Critical',
        MetricData: [{
          MetricName: 'CriticalSecurityEvent',
          Value: 1,
          Unit: 'Count',
          Timestamp: event.timestamp,
          Dimensions: [
            { Name: 'EventType', Value: event.type },
            { Name: 'Service', Value: 'authentication-service' }
          ]
        }]
      });

      await this.cloudWatch.send(command);
    } catch (error) {
      logger.error('Failed to send critical security alert', {
        error: (error as Error).message
      });
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushEvents(); // Final flush
  }
}
```

### Automated GDPR Compliance Pattern

#### Data Retention and Privacy Management
```typescript
interface DataRetentionPolicy {
  tableName: string;
  retentionDays: number;
  dateColumn: string;
  conditions?: string;
}

class GDPRComplianceService {
  private pool: Pool;
  private retentionPolicies: DataRetentionPolicy[] = [
    {
      tableName: 'authentication_logs',
      retentionDays: 90,
      dateColumn: 'created_at'
    },
    {
      tableName: 'email_verifications',
      retentionDays: 30,
      dateColumn: 'created_at',
      conditions: 'verified_at IS NOT NULL'
    },
    {
      tableName: 'password_resets',
      retentionDays: 7,
      dateColumn: 'created_at',
      conditions: 'used_at IS NOT NULL'
    },
    {
      tableName: 'refresh_tokens',
      retentionDays: 30,
      dateColumn: 'created_at',
      conditions: 'revoked_at IS NOT NULL OR expires_at < NOW()'
    }
  ];

  constructor(pool: Pool) {
    this.pool = pool;
    
    // Run cleanup daily at 2 AM
    this.scheduleCleanup();
  }

  // Automated data retention cleanup
  async runDataRetentionCleanup(): Promise<void> {
    logger.info('Starting GDPR data retention cleanup');

    for (const policy of this.retentionPolicies) {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

        let query = `
          DELETE FROM ${policy.tableName}
          WHERE ${policy.dateColumn} < $1
        `;

        if (policy.conditions) {
          query += ` AND ${policy.conditions}`;
        }

        const result = await this.pool.query(query, [cutoffDate]);
        
        logger.info('Data retention cleanup completed', {
          table: policy.tableName,
          deletedRows: result.rowCount,
          cutoffDate: cutoffDate.toISOString()
        });
      } catch (error) {
        logger.error('Data retention cleanup failed', {
          table: policy.tableName,
          error: (error as Error).message
        });
      }
    }
  }

  // User data export (GDPR Article 20)
  async exportUserData(userId: string): Promise<any> {
    try {
      const userData = {
        user: await this.pool.query('SELECT id, email, name, phone, created_at, updated_at FROM users WHERE id = $1', [userId]),
        profile: await this.pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]),
        authLogs: await this.pool.query('SELECT event_type, success, ip_address, created_at FROM authentication_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId])
      };

      logger.info('User data exported', { userId });
      return userData;
    } catch (error) {
      logger.error('Failed to export user data', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  // User data deletion (GDPR Article 17)
  async deleteUserData(userId: string, reason: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Log the deletion request
      await client.query(
        'INSERT INTO data_deletion_log (user_id, reason, deleted_at) VALUES ($1, $2, NOW())',
        [userId, reason]
      );

      // Delete user data in correct order (respecting foreign keys)
      await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM email_verifications WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
      
      // Anonymize authentication logs instead of deleting (for security audit)
      await client.query(
        'UPDATE authentication_logs SET user_id = NULL, email = \'[deleted]\' WHERE user_id = $1',
        [userId]
      );
      
      // Finally delete the user record
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');
      
      logger.info('User data deleted successfully', { userId, reason });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to delete user data', {
        userId,
        reason,
        error: (error as Error).message
      });
      throw error;
    } finally {
      client.release();
    }
  }

  private scheduleCleanup(): void {
    // Calculate milliseconds until next 2 AM
    const now = new Date();
    const next2AM = new Date();
    next2AM.setHours(2, 0, 0, 0);
    
    if (next2AM <= now) {
      next2AM.setDate(next2AM.getDate() + 1);
    }
    
    const msUntil2AM = next2AM.getTime() - now.getTime();
    
    // Schedule first cleanup
    setTimeout(() => {
      this.runDataRetentionCleanup();
      
      // Then run daily
      setInterval(() => {
        this.runDataRetentionCleanup();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntil2AM);
  }
}
```