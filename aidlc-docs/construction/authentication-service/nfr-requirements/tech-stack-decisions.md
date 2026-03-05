# Authentication Service - Tech Stack Decisions

## Programming Language and Framework

### Selected: Node.js with TypeScript

#### Rationale
- **Ecosystem Alignment**: Matches the overall system architecture (React Native mobile app)
- **Development Speed**: Rapid development with extensive npm ecosystem
- **JSON Handling**: Native JSON support ideal for JWT tokens and API responses
- **Async Performance**: Excellent for I/O-intensive authentication operations
- **Team Expertise**: Leverages JavaScript/TypeScript skills across full stack

#### Framework Choice: Express.js
- **Mature Ecosystem**: Well-established with extensive middleware support
- **Security Middleware**: Built-in security features (helmet, cors, rate limiting)
- **JWT Integration**: Excellent JWT libraries (jsonwebtoken, passport-jwt)
- **Testing Support**: Comprehensive testing frameworks (Jest, Supertest)
- **Documentation**: Extensive documentation and community support

#### Alternative Considerations
- **Java/Spring Boot**: More enterprise-focused but heavier for this use case
- **Python/FastAPI**: Good for ML integration but less aligned with frontend
- **Go**: High performance but steeper learning curve and smaller ecosystem

### Development Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "typescript": "^5.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "pg": "^8.8.0",
    "redis": "^4.5.0",
    "helmet": "^6.0.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.7.0",
    "joi": "^17.7.0",
    "winston": "^3.8.0"
  },
  "devDependencies": {
    "jest": "^29.3.0",
    "supertest": "^6.3.0",
    "@types/node": "^18.11.0",
    "nodemon": "^2.0.20",
    "eslint": "^8.30.0",
    "prettier": "^2.8.0"
  }
}
```

## Database Technology

### Selected: PostgreSQL + Redis Multi-Database Approach

#### Primary Database: PostgreSQL
**Use Cases**: User data, authentication records, audit logs

**Rationale**:
- **ACID Compliance**: Ensures data consistency for user accounts and tokens
- **Relational Model**: Perfect fit for normalized user/profile/token relationships
- **JSON Support**: Native JSONB support for user preferences and metadata
- **Performance**: Excellent performance with proper indexing
- **AWS Integration**: Fully managed with AWS RDS

**Configuration**:
- **Version**: PostgreSQL 14+
- **Instance Type**: db.t3.medium (2 vCPU, 4 GB RAM)
- **Storage**: 100 GB GP2 with auto-scaling enabled
- **Backup**: Automated daily backups with 30-day retention
- **Encryption**: Encryption at rest using AWS KMS

#### Caching Layer: Redis
**Use Cases**: Session caching, rate limiting, token blacklist

**Rationale**:
- **High Performance**: Sub-millisecond response times for caching
- **Data Structures**: Rich data types for rate limiting and blacklists
- **Persistence**: Optional persistence for critical cached data
- **Scalability**: Easy horizontal scaling with Redis Cluster
- **AWS Integration**: Fully managed with AWS ElastiCache

**Configuration**:
- **Version**: Redis 7.0+
- **Instance Type**: cache.t3.micro (2 vCPU, 1 GB RAM)
- **Replication**: Single node initially, multi-AZ for production
- **Persistence**: RDB snapshots for data durability
- **Encryption**: Encryption in transit and at rest

#### Alternative Considerations
- **MongoDB**: Document-based but less suitable for relational authentication data
- **MySQL**: Good performance but PostgreSQL offers better JSON support
- **DynamoDB**: Serverless but complex for relational queries

### Database Schema Design

#### Connection Management
```typescript
// PostgreSQL Connection Pool
const pgPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 10000  // Connection timeout
});

// Redis Connection
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    rejectUnauthorized: false
  }
});
```

## Deployment Platform

### Selected: AWS ECS (Elastic Container Service)

#### Rationale
- **Container Orchestration**: Managed container orchestration without Kubernetes complexity
- **Auto Scaling**: Automatic scaling based on CPU/memory metrics
- **Load Balancing**: Integrated with Application Load Balancer
- **Service Discovery**: Built-in service discovery and health checks
- **Cost Effective**: Pay only for resources used, no cluster management overhead

#### ECS Configuration
```yaml
# ECS Task Definition
family: authentication-service
networkMode: awsvpc
requiresCompatibilities:
  - FARGATE
cpu: 2048        # 2 vCPU
memory: 4096     # 4 GB RAM
executionRoleArn: arn:aws:iam::account:role/ecsTaskExecutionRole
taskRoleArn: arn:aws:iam::account:role/authServiceTaskRole

containerDefinitions:
  - name: auth-service
    image: auth-service:latest
    portMappings:
      - containerPort: 3000
        protocol: tcp
    environment:
      - name: NODE_ENV
        value: production
      - name: PORT
        value: "3000"
    secrets:
      - name: DB_PASSWORD
        valueFrom: arn:aws:ssm:region:account:parameter/auth/db-password
      - name: JWT_SECRET
        valueFrom: arn:aws:ssm:region:account:parameter/auth/jwt-secret
    logConfiguration:
      logDriver: awslogs
      options:
        awslogs-group: /ecs/authentication-service
        awslogs-region: us-east-1
        awslogs-stream-prefix: ecs
```

#### Service Configuration
```yaml
# ECS Service
serviceName: authentication-service
cluster: car-health-monitor-cluster
taskDefinition: authentication-service:1
desiredCount: 2
launchType: FARGATE

networkConfiguration:
  awsvpcConfiguration:
    subnets:
      - subnet-private-1a
      - subnet-private-1b
    securityGroups:
      - sg-auth-service
    assignPublicIp: DISABLED

loadBalancers:
  - targetGroupArn: arn:aws:elasticloadbalancing:region:account:targetgroup/auth-service
    containerName: auth-service
    containerPort: 3000

serviceTags:
  - key: Environment
    value: production
  - key: Service
    value: authentication
```

#### Alternative Considerations
- **AWS Lambda**: Serverless but cold start latency for authentication
- **AWS EKS**: Kubernetes but adds complexity for this scale
- **AWS EC2**: More control but requires more operational overhead

## Security Architecture

### JWT Token Management

#### JWT Configuration
```typescript
interface JWTConfig {
  algorithm: 'HS256';
  issuer: 'car-health-monitor-auth';
  audience: 'car-health-monitor-services';
  accessTokenExpiry: '15m';
  refreshTokenExpiry: '7d';
  secretRotation: 'monthly';
}

// JWT Token Generation
const generateAccessToken = (user: User): string => {
  return jwt.sign(
    {
      user_id: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET!,
    {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: 'car-health-monitor-auth',
      audience: 'car-health-monitor-services'
    }
  );
};
```

#### Key Management
- **AWS Systems Manager Parameter Store**: Secure storage for JWT secrets
- **Key Rotation**: Monthly automatic key rotation
- **Multi-Key Support**: Support multiple keys during rotation period
- **Cross-Service Distribution**: Secure distribution to all microservices

### Encryption Strategy

#### Data at Rest
- **Database Encryption**: AWS RDS encryption using AWS KMS
- **Parameter Store**: Encrypted parameters for secrets
- **S3 Encryption**: Server-side encryption for any file storage
- **EBS Encryption**: Encrypted EBS volumes for container storage

#### Data in Transit
- **TLS 1.3**: All API communications use TLS 1.3
- **Internal Communication**: TLS for service-to-service communication
- **Database Connections**: SSL/TLS for database connections
- **Redis Connections**: TLS for Redis connections

## Monitoring and Observability

### Logging Strategy

#### Structured Logging with Winston
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'authentication-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Authentication Event Logging
const logAuthEvent = (event: AuthEvent) => {
  logger.info('Authentication Event', {
    event_type: event.type,
    user_id: event.userId,
    email: event.email,
    success: event.success,
    ip_address: event.ipAddress,
    user_agent: event.userAgent,
    timestamp: new Date().toISOString()
  });
};
```

#### Log Aggregation
- **AWS CloudWatch Logs**: Centralized log collection
- **Log Groups**: Separate log groups per service
- **Log Retention**: 90 days retention for audit compliance
- **Log Insights**: CloudWatch Logs Insights for log analysis

### Metrics Collection

#### Application Metrics
```typescript
// Custom Metrics with CloudWatch
import AWS from 'aws-sdk';
const cloudwatch = new AWS.CloudWatch();

const recordMetric = async (metricName: string, value: number, unit: string = 'Count') => {
  await cloudwatch.putMetricData({
    Namespace: 'CarHealthMonitor/Authentication',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  }).promise();
};

// Usage Examples
await recordMetric('LoginAttempts', 1);
await recordMetric('LoginFailures', 1);
await recordMetric('TokenRefreshes', 1);
await recordMetric('ResponseTime', responseTime, 'Milliseconds');
```

#### Infrastructure Metrics
- **ECS Metrics**: CPU, memory, network utilization
- **RDS Metrics**: Database performance and connections
- **ALB Metrics**: Request count, response times, error rates
- **Custom Metrics**: Business-specific authentication metrics

### Health Checks

#### Service Health Endpoint
```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    checks: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
  
  const isHealthy = Object.values(health.checks).every(check => 
    typeof check === 'object' ? check.status === 'healthy' : true
  );
  
  res.status(isHealthy ? 200 : 503).json(health);
});
```

## Development and Testing

### Testing Strategy

#### Unit Testing with Jest
```typescript
// Example Test Structure
describe('AuthenticationService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const result = await authService.login('user@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.access_token).toMatch(/^eyJ/); // JWT format
    });

    it('should fail for invalid credentials', async () => {
      const result = await authService.login('user@example.com', 'wrongpassword');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });
});
```

#### Integration Testing
- **API Testing**: Supertest for HTTP endpoint testing
- **Database Testing**: Test database with Docker containers
- **Redis Testing**: Mock Redis for unit tests, real Redis for integration
- **End-to-End**: Full authentication flow testing

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
name: Authentication Service CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to AWS ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: task-definition.json
          service: authentication-service
          cluster: car-health-monitor-cluster
```

## Cost Optimization

### Resource Sizing
- **ECS Tasks**: Start with 2 vCPU, 4 GB RAM, scale based on usage
- **RDS Instance**: db.t3.medium initially, upgrade based on performance
- **Redis**: cache.t3.micro initially, scale based on cache hit rates
- **Load Balancer**: Application Load Balancer with minimal rules

### Cost Monitoring
- **AWS Cost Explorer**: Track costs by service and resource
- **Budget Alerts**: Set up budget alerts for cost overruns
- **Resource Tagging**: Comprehensive tagging for cost allocation
- **Right-sizing**: Regular review of resource utilization

## Technology Decision Summary

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Runtime** | Node.js 18+ TypeScript | Ecosystem alignment, rapid development |
| **Framework** | Express.js | Mature, secure, extensive middleware |
| **Database** | PostgreSQL 14+ | ACID compliance, JSON support, AWS RDS |
| **Caching** | Redis 7.0+ | High performance, rich data types |
| **Deployment** | AWS ECS Fargate | Managed containers, auto-scaling |
| **Load Balancer** | AWS ALB | HTTP/HTTPS routing, health checks |
| **Monitoring** | CloudWatch | Native AWS integration, comprehensive |
| **Security** | AWS KMS, Parameter Store | Managed encryption, secret management |
| **CI/CD** | GitHub Actions | Integrated with repository, AWS deployment |