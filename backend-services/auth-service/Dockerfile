# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS runtime

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S authservice -u 1001

WORKDIR /app

# Copy dependencies and built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/knexfile.js ./
COPY --from=builder /app/migrations ./migrations

# Change ownership to non-root user
RUN chown -R authservice:nodejs /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/liveness || exit 1

USER authservice

EXPOSE 3000

CMD ["node", "dist/server.js"]