# Authentication Service - Logical Components

## Infrastructure Components Architecture

### Message Queue Components

#### Simple SQS Queue for Background Tasks
```yaml
# CloudFormation Template for SQS Queues
Resources:
  # Email Processing Queue
  EmailQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: auth-service-email-queue
      VisibilityTimeoutSeconds: 300  # 5 minutes
      MessageRetentionPeriod: 1209600  # 14 days
      ReceiveMessageWaitTimeSeconds: 20  # Long polling
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt EmailDeadLetterQueue.Arn
        maxReceiveCount: 3

  # Dead Letter Queue for failed email processing
  EmailDeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: auth-service-email-dlq
      MessageRetentionPeriod: 1209600  # 14 days

  # Background Task Queue
  BackgroundTaskQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: auth-service-background-tasks
      VisibilityTimeoutSeconds: 600  # 10 minutes
      MessageRetentionPeriod: 1209600  # 14 days
      ReceiveMessageWaitTimeSeconds: 20
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt BackgroundTaskDeadLetterQueue.Arn
        maxReceiveCount: 3

  BackgroundTaskDeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: auth-service-background-tasks-dlq
      MessageRetentionPeriod: 1209600
```

#### Queue Processing Service
```typescript
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

interface QueueMessage {
  type: 'email_verification' | 'password_reset' | 'data_cleanup' | 'security_alert';
  payload: any;
  timestamp: string;
  retryCount?: number;
}

class QueueService {
  private sqsClient: SQSClient;
  private emailQueueUrl: string;
  private backgroundTaskQueueUrl: string;
  private isProcessing = false;

  constructor() {
    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.emailQueueUrl = process.env.EMAIL_QUEUE_URL!;
    this.backgroundTaskQueueUrl = process.env.BACKGROUND_TASK_QUEUE_URL!;
  }

  // Send email verification message
  async sendEmailVerificationMessage(userId: string, email: string, token: string): Promise<void> {
    const message: QueueMessage = {
      type: 'email_verification',
      payload: { userId, email, token },
      timestamp: new Date().toISOString()
    };

    await this.sendMessage(this.emailQueueUrl, message);
  }

  // Send password reset message
  async sendPasswordResetMessage(userId: string, email: string, token: string): Promise<void> {
    const message: QueueMessage = {
      type: 'password_reset',
      payload: { userId, email, token },
      timestamp: new Date().toISOString()
    };

    await this.sendMessage(this.emailQueueUrl, message);
  }

  // Send background task message
  async sendBackgroundTaskMessage(taskType: string, payload: any): Promise<void> {
    const message: QueueMessage = {
      type: taskType as any,
      payload,
      timestamp: new Date().toISOString()
    };

    await this.sendMessage(this.backgroundTaskQueueUrl, message);
  }

  private async sendMessage(queueUrl: string, message: QueueMessage): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          MessageType: {
            StringValue: message.type,
            DataType: 'String'
          }
        }
      });

      await this.sqsClient.send(command);
      
      logger.info('Message sent to queue', {
        queueUrl,
        messageType: message.type
      });
    } catch (error) {
      logger.error('Failed to send message to queue', {
        queueUrl,
        messageType: message.type,
        error: (error as Error).message
      });
      throw error;
    }
  }

  // Start processing messages
  startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    // Process email queue
    this.processQueue(this.emailQueueUrl, this.handleEmailMessage.bind(this));
    
    // Process background task queue
    this.processQueue(this.backgroundTaskQueueUrl, this.handleBackgroundTask.bind(this));
  }

  private async processQueue(
    queueUrl: string,
    messageHandler: (message: QueueMessage) => Promise<void>
  ): Promise<void> {
    while (this.isProcessing) {
      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
          MessageAttributeNames: ['All']
        });

        const response = await this.sqsClient.send(command);
        
        if (response.Messages) {
          for (const sqsMessage of response.Messages) {
            try {
              const message: QueueMessage = JSON.parse(sqsMessage.Body!);
              await messageHandler(message);
              
              // Delete message after successful processing
              await this.sqsClient.send(new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: sqsMessage.ReceiptHandle!
              }));
              
            } catch (error) {
              logger.error('Failed to process queue message', {
                queueUrl,
                error: (error as Error).message,
                messageId: sqsMessage.MessageId
              });
            }
          }
        }
      } catch (error) {
        logger.error('Failed to receive messages from queue', {
          queueUrl,
          error: (error as Error).message
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async handleEmailMessage(message: QueueMessage): Promise<void> {
    switch (message.type) {
      case 'email_verification':
        await this.sendVerificationEmail(message.payload);
        break;
      case 'password_reset':
        await this.sendPasswordResetEmail(message.payload);
        break;
      default:
        logger.warn('Unknown email message type', { type: message.type });
    }
  }

  private async handleBackgroundTask(message: QueueMessage): Promise<void> {
    switch (message.type) {
      case 'data_cleanup':
        await this.performDataCleanup(message.payload);
        break;
      case 'security_alert':
        await this.sendSecurityAlert(message.payload);
        break;
      default:
        logger.warn('Unknown background task type', { type: message.type });
    }
  }

  private async sendVerificationEmail(payload: any): Promise<void> {
    // Email sending implementation
    logger.info('Sending verification email', { userId: payload.userId });
  }

  private async sendPasswordResetEmail(payload: any): Promise<void> {
    // Email sending implementation
    logger.info('Sending password reset email', { userId: payload.userId });
  }

  private async performDataCleanup(payload: any): Promise<void> {
    // Data cleanup implementation
    logger.info('Performing data cleanup', payload);
  }

  private async sendSecurityAlert(payload: any): Promise<void> {
    // Security alert implementation
    logger.info('Sending security alert', payload);
  }

  stopProcessing(): void {
    this.isProcessing = false;
  }
}
```

### Caching Infrastructure Components

#### Single Redis Instance Configuration
```yaml
# CloudFormation Template for Redis
Resources:
  # ElastiCache Subnet Group
  RedisSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Subnet group for Authentication Service Redis
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  # Redis Security Group
  RedisSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Authentication Service Redis
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref AuthServiceSecurityGroup
      Tags:
        - Key: Name
          Value: auth-service-redis-sg

  # Redis Cluster
  RedisCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheNodeType: cache.t3.micro
      Engine: redis
      EngineVersion: 7.0
      NumCacheNodes: 1
      Port: 6379
      CacheSubnetGroupName: !Ref RedisSubnetGroup
      VpcSecurityGroupIds:
        - !Ref RedisSecurityGroup
      
      # Backup and Maintenance
      PreferredMaintenanceWindow: sun:03:00-sun:04:00
      SnapshotRetentionLimit: 7
      SnapshotWindow: 02:00-03:00
      
      # Encryption
      TransitEncryptionEnabled: true
      AtRestEncryptionEnabled: true
      
      Tags:
        - Key: Name
          Value: auth-service-redis
        - Key: Environment
          Value: production
```

#### Redis Connection and Management
```typescript
import { createClient, RedisClientType } from 'redis';

class RedisManager {
  private client: RedisClientType;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false,
        reconnectStrategy: (retries) => {
          if (retries >= this.maxReconnectAttempts) {
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
      this.reconnectAttempts = 0;
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', { error: error.message });
      this.isConnected = false;
    });

    this.client.on('disconnect', () => {
      logger.warn('Redis client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      this.reconnectAttempts++;
      logger.info('Redis client reconnecting', { attempt: this.reconnectAttempts });
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

  // Health check for Redis
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed', { error: (error as Error).message });
      return false;
    }
  }

  // Get Redis info for monitoring
  async getInfo(): Promise<any> {
    try {
      const info = await this.client.info();
      return this.parseRedisInfo(info);
    } catch (error) {
      logger.error('Failed to get Redis info', { error: (error as Error).message });
      return null;
    }
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }
}
```

### Monitoring Infrastructure Components

#### CloudWatch Custom Metrics and Dashboards
```yaml
# CloudFormation Template for Monitoring
Resources:
  # CloudWatch Dashboard
  AuthServiceDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: AuthenticationService
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "CarHealthMonitor/Authentication", "LoginAttempts" ],
                  [ ".", "LoginFailures" ],
                  [ ".", "LoginSuccesses" ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Authentication Metrics"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/ECS", "CPUUtilization", "ServiceName", "authentication-service" ],
                  [ ".", "MemoryUtilization", ".", "." ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Service Performance"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 12,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "CarHealthMonitor/Security", "SecurityEvent_login_failure" ],
                  [ ".", "SecurityEvent_brute_force" ],
                  [ ".", "SecurityEvent_account_lockout" ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Security Events"
              }
            }
          ]
        }

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: AuthService-HighCPU
      AlarmDescription: Authentication service high CPU utilization
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: authentication-service
      AlarmActions:
        - !Ref SNSAlarmTopic

  HighMemoryAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: AuthService-HighMemory
      AlarmDescription: Authentication service high memory utilization
      MetricName: MemoryUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 85
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: authentication-service
      AlarmActions:
        - !Ref SNSAlarmTopic

  HighLoginFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: AuthService-HighLoginFailures
      AlarmDescription: High number of login failures detected
      MetricName: LoginFailures
      Namespace: CarHealthMonitor/Authentication
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 50
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSSecurityTopic

  # SNS Topics for Alerts
  SNSAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: auth-service-alarms
      DisplayName: Authentication Service Alarms

  SNSSecurityTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: auth-service-security
      DisplayName: Authentication Service Security Alerts
```

#### Custom Metrics Collection Service
```typescript
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

interface MetricData {
  name: string;
  value: number;
  unit: string;
  dimensions?: { [key: string]: string };
  timestamp?: Date;
}

class MetricsCollector {
  private cloudWatch: CloudWatchClient;
  private metricsBuffer: MetricData[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    this.cloudWatch = new CloudWatchClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });

    // Flush metrics every 60 seconds
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 60000);
  }

  // Record authentication metrics
  recordLoginAttempt(success: boolean, responseTime: number): void {
    this.addMetric('LoginAttempts', 1, 'Count');
    
    if (success) {
      this.addMetric('LoginSuccesses', 1, 'Count');
    } else {
      this.addMetric('LoginFailures', 1, 'Count');
    }
    
    this.addMetric('LoginResponseTime', responseTime, 'Milliseconds');
  }

  // Record token operations
  recordTokenRefresh(responseTime: number): void {
    this.addMetric('TokenRefreshes', 1, 'Count');
    this.addMetric('TokenRefreshResponseTime', responseTime, 'Milliseconds');
  }

  // Record database metrics
  recordDatabaseQuery(queryName: string, duration: number, success: boolean): void {
    this.addMetric('DatabaseQueries', 1, 'Count', { QueryName: queryName });
    this.addMetric('DatabaseQueryDuration', duration, 'Milliseconds', { QueryName: queryName });
    
    if (!success) {
      this.addMetric('DatabaseQueryErrors', 1, 'Count', { QueryName: queryName });
    }
  }

  // Record cache metrics
  recordCacheOperation(operation: 'hit' | 'miss' | 'set', cacheType: string): void {
    this.addMetric(`Cache${operation.charAt(0).toUpperCase() + operation.slice(1)}`, 1, 'Count', { CacheType: cacheType });
  }

  // Record security events
  recordSecurityEvent(eventType: string, severity: string): void {
    this.addMetric('SecurityEvents', 1, 'Count', { EventType: eventType, Severity: severity });
  }

  private addMetric(name: string, value: number, unit: string, dimensions?: { [key: string]: string }): void {
    this.metricsBuffer.push({
      name,
      value,
      unit,
      dimensions,
      timestamp: new Date()
    });
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      // Group metrics by namespace
      const authMetrics = this.metricsBuffer.filter(m => 
        ['LoginAttempts', 'LoginSuccesses', 'LoginFailures', 'LoginResponseTime', 'TokenRefreshes', 'TokenRefreshResponseTime'].includes(m.name)
      );
      
      const dbMetrics = this.metricsBuffer.filter(m => 
        m.name.startsWith('Database')
      );
      
      const cacheMetrics = this.metricsBuffer.filter(m => 
        m.name.startsWith('Cache')
      );
      
      const securityMetrics = this.metricsBuffer.filter(m => 
        m.name === 'SecurityEvents'
      );

      // Send metrics to different namespaces
      await this.sendMetricsToNamespace('CarHealthMonitor/Authentication', authMetrics);
      await this.sendMetricsToNamespace('CarHealthMonitor/Database', dbMetrics);
      await this.sendMetricsToNamespace('CarHealthMonitor/Cache', cacheMetrics);
      await this.sendMetricsToNamespace('CarHealthMonitor/Security', securityMetrics);

      // Clear buffer
      this.metricsBuffer = [];
      
      logger.debug('Metrics flushed to CloudWatch');
    } catch (error) {
      logger.error('Failed to flush metrics to CloudWatch', {
        error: (error as Error).message,
        metricsCount: this.metricsBuffer.length
      });
    }
  }

  private async sendMetricsToNamespace(namespace: string, metrics: MetricData[]): Promise<void> {
    if (metrics.length === 0) return;

    const metricData = metrics.map(metric => ({
      MetricName: metric.name,
      Value: metric.value,
      Unit: metric.unit,
      Timestamp: metric.timestamp,
      Dimensions: metric.dimensions ? Object.entries(metric.dimensions).map(([name, value]) => ({
        Name: name,
        Value: value
      })) : undefined
    }));

    const command = new PutMetricDataCommand({
      Namespace: namespace,
      MetricData: metricData
    });

    await this.cloudWatch.send(command);
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushMetrics(); // Final flush
  }
}
```

## Component Integration Architecture

### Service Integration Pattern
```typescript
// Main service integration
class AuthenticationServiceIntegration {
  private dbManager: DatabaseConnectionManager;
  private redisManager: RedisManager;
  private queueService: QueueService;
  private metricsCollector: MetricsCollector;
  private securityMonitor: SecurityEventMonitor;
  private gdprService: GDPRComplianceService;

  constructor() {
    this.dbManager = new DatabaseConnectionManager();
    this.redisManager = new RedisManager();
    this.queueService = new QueueService();
    this.metricsCollector = new MetricsCollector();
    this.securityMonitor = new SecurityEventMonitor();
    this.gdprService = new GDPRComplianceService(this.dbManager.pool);
  }

  async initialize(): Promise<void> {
    // Initialize all components
    await this.redisManager.connect();
    this.queueService.startProcessing();
    
    logger.info('Authentication service components initialized');
  }

  async shutdown(): Promise<void> {
    // Graceful shutdown of all components
    this.queueService.stopProcessing();
    await this.redisManager.disconnect();
    this.metricsCollector.destroy();
    this.securityMonitor.destroy();
    
    logger.info('Authentication service components shut down');
  }

  // Health check for all components
  async healthCheck(): Promise<any> {
    return {
      database: await this.dbManager.getMetrics(),
      redis: await this.redisManager.ping(),
      timestamp: new Date().toISOString()
    };
  }
}
```

## Component Deployment Strategy

### Docker Container Configuration
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S authservice -u 1001

WORKDIR /app

# Copy dependencies and application
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=authservice:nodejs . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node healthcheck.js

USER authservice

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Component Resource Allocation
```yaml
# ECS Task Definition with resource allocation
Resources:
  AuthServiceTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: authentication-service
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: 2048      # 2 vCPU
      Memory: 4096   # 4 GB RAM
      
      ContainerDefinitions:
        - Name: auth-service
          Image: !Sub ${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/auth-service:latest
          
          # Resource limits
          Cpu: 2048
          Memory: 4096
          MemoryReservation: 3072  # Soft limit
          
          # Environment variables
          Environment:
            - Name: NODE_ENV
              Value: production
            - Name: PORT
              Value: "3000"
            - Name: AWS_REGION
              Value: !Ref AWS::Region
          
          # Secrets from Parameter Store
          Secrets:
            - Name: DB_PASSWORD
              ValueFrom: !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/auth/db-password
            - Name: JWT_SECRET
              ValueFrom: !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/auth/jwt-secret
            - Name: REDIS_URL
              ValueFrom: !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/auth/redis-url
          
          # Logging configuration
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref AuthServiceLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
          
          # Health check
          HealthCheck:
            Command:
              - CMD-SHELL
              - "curl -f http://localhost:3000/health/liveness || exit 1"
            Interval: 30
            Timeout: 10
            Retries: 3
            StartPeriod: 60
```

This comprehensive logical components architecture provides:

- **Scalable message processing** with SQS queues and dead letter queues
- **High-performance caching** with Redis and connection management
- **Comprehensive monitoring** with CloudWatch metrics, dashboards, and alarms
- **Production-ready deployment** with proper resource allocation and health checks
- **Integrated security** with encryption, monitoring, and compliance features