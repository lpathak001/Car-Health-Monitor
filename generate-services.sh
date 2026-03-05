#!/bin/bash

# Service generator script for Car Health Monitor
# Generates minimal microservices with default configurations

echo "🚀 Generating all microservices..."

# Backend Services
BACKEND_SERVICES=(
  "vehicle-service:3001"
  "sensor-data-service:3002"
  "health-analysis-service:3003"
  "alert-service:3004"
)

# Create each backend service
for service_info in "${BACKEND_SERVICES[@]}"; do
  IFS=':' read -r service port <<< "$service_info"
  echo "Creating $service on port $port..."
  
  mkdir -p "backend-services/$service/src"
  
  # Create minimal package.json
  cat > "backend-services/$service/package.json" <<EOF
{
  "name": "$service",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.0",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.2",
    "ts-node-dev": "^2.0.0"
  }
}
EOF

  # Create tsconfig.json
  cp backend-services/auth-service/tsconfig.json "backend-services/$service/"
  
  # Create .env
  cat > "backend-services/$service/.env" <<EOF
NODE_ENV=development
PORT=$port
DB_HOST=localhost
DB_PORT=5432
DB_NAME=car_health_monitor
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
EOF

done

echo "✅ All services generated!"
echo "📦 Installing dependencies..."
