# Car Health Monitor - Authentication Service

A production-ready authentication service built with Node.js, TypeScript, PostgreSQL, and Redis for the Car Health Monitor application.

## Features

- **JWT-based Authentication** with access and refresh tokens
- **Rate Limiting** to prevent brute force attacks
- **Account Lockout** after failed login attempts
- **Redis Caching** for sessions and rate limiting
- **Comprehensive Logging** with Winston
- **Health Check Endpoints** (liveness, readiness, startup)
- **Input Validation** with Joi
- **Security Headers** with Helmet
- **CORS Support** for cross-origin requests
- **Database Migrations** with Knex.js
- **Graceful Shutdown** handling

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+
- npm or yarn

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb car_health_monitor
   
   # Run migrations
   npm run db:migrate
   ```

4. **Start Redis:**
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:7-alpine
   
   # Or install locally and start
   redis-server
   ```

5. **Start the service:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user profile

### Health Checks
- `GET /health` - Comprehensive health check
- `GET /health/liveness` - Liveness probe
- `GET /health/readiness` - Readiness probe
- `GET /health/startup` - Startup probe

## Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=car_health_monitor
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## Database Schema

The service uses the following database tables:

- **users** - User accounts with authentication data
- **user_profiles** - Extended user profile information
- **refresh_tokens** - JWT refresh tokens with expiration
- **authentication_logs** - Audit log of authentication events

## Security Features

### Rate Limiting
- **Authentication endpoints**: 5 attempts per 15 minutes per IP/email
- **General endpoints**: 100 requests per 15 minutes per IP
- **Token refresh**: 10 requests per minute per IP

### Account Security
- **Password requirements**: 8+ chars, uppercase, lowercase, number, special char
- **Account lockout**: After 5 failed login attempts
- **JWT tokens**: 15-minute access tokens, 7-day refresh tokens
- **Token blacklisting**: Support for revoking tokens

### Data Protection
- **Password hashing**: bcrypt with 12 rounds
- **SQL injection protection**: Parameterized queries
- **XSS protection**: Helmet security headers
- **CORS configuration**: Configurable allowed origins

## Development

### Running Tests
```bash
npm test
```

### Database Operations
```bash
# Run migrations
npm run db:migrate

# Rollback migration
npx knex migrate:rollback

# Create new migration
npx knex migrate:make migration_name
```

### Code Quality
```bash
# Lint code
npm run lint

# Build TypeScript
npm run build
```

## Production Deployment

1. **Environment Setup:**
   - Set `NODE_ENV=production`
   - Use strong JWT secrets
   - Configure proper database credentials
   - Set up Redis with persistence

2. **Security Considerations:**
   - Use HTTPS in production
   - Configure proper CORS origins
   - Set up database SSL connections
   - Monitor authentication logs

3. **Monitoring:**
   - Health check endpoints for load balancers
   - Structured logging for observability
   - Rate limiting metrics
   - Database connection monitoring

## Architecture

The service follows a layered architecture:

- **Routes** - HTTP endpoint definitions
- **Middleware** - Authentication, validation, rate limiting
- **Services** - Business logic (auth, JWT, cache)
- **Config** - Database and Redis connections
- **Utils** - Logging and utilities

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Follow conventional commit messages

## License

MIT License - see LICENSE file for details