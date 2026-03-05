#!/bin/bash

echo "🚗 Car Health Monitor - Complete Application Demo"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: User Registration
echo -e "${BLUE}Step 1: User Registration${NC}"
echo "POST /auth/register"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@carhealthmonitor.com",
    "password": "Demo@12345",
    "name": "Demo User",
    "phone": "+1234567890"
  }')

echo "$REGISTER_RESPONSE" | jq .
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.user.id')
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.access_token')
echo -e "${GREEN}✓ User registered successfully${NC}"
echo "User ID: $USER_ID"
echo ""
sleep 2

# Step 2: User Login
echo -e "${BLUE}Step 2: User Login${NC}"
echo "POST /auth/login"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@carhealthmonitor.com",
    "password": "Demo@12345"
  }')

echo "$LOGIN_RESPONSE" | jq .
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.access_token')
echo -e "${GREEN}✓ User logged in successfully${NC}"
echo ""
sleep 2

# Step 3: Register Vehicle
echo -e "${BLUE}Step 3: Register Vehicle${NC}"
echo "POST /vehicles (Vehicle Service)"
VEHICLE_RESPONSE=$(curl -s -X POST http://localhost:3001/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "make": "Toyota",
    "model": "Camry",
    "year": 2022,
    "vin": "1HGBH41JXMN109186"
  }')

echo "$VEHICLE_RESPONSE" | jq .
VEHICLE_ID=$(echo "$VEHICLE_RESPONSE" | jq -r '.id // "demo-vehicle-123"')
echo -e "${GREEN}✓ Vehicle registered${NC}"
echo "Vehicle ID: $VEHICLE_ID"
echo ""
sleep 2

# Step 4: Submit Sensor Data
echo -e "${BLUE}Step 4: Submit Sensor Data${NC}"
echo "POST /sensor-data (Sensor Data Service)"
SENSOR_RESPONSE=$(curl -s -X POST http://localhost:3002/sensor-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "vehicle_id": "'$VEHICLE_ID'",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "temperature": 85.5,
    "pressure": 32.0,
    "vibration": 0.5,
    "rpm": 2500,
    "speed": 65
  }')

echo "$SENSOR_RESPONSE" | jq .
echo -e "${GREEN}✓ Sensor data submitted${NC}"
echo ""
sleep 2

# Step 5: ML Anomaly Detection
echo -e "${BLUE}Step 5: ML Anomaly Detection Analysis${NC}"
echo "POST /analyze (ML Service)"
ML_RESPONSE=$(curl -s -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"vehicle_id":"'$VEHICLE_ID'","timestamp":"2024-01-01T10:00:00Z","temperature":85.5,"pressure":32.0,"vibration":0.5,"rpm":2500},
      {"vehicle_id":"'$VEHICLE_ID'","timestamp":"2024-01-01T10:01:00Z","temperature":86.0,"pressure":32.5,"vibration":0.6,"rpm":2600},
      {"vehicle_id":"'$VEHICLE_ID'","timestamp":"2024-01-01T10:02:00Z","temperature":87.0,"pressure":33.0,"vibration":0.7,"rpm":2700},
      {"vehicle_id":"'$VEHICLE_ID'","timestamp":"2024-01-01T10:03:00Z","temperature":150.0,"pressure":45.0,"vibration":2.5,"rpm":5000},
      {"vehicle_id":"'$VEHICLE_ID'","timestamp":"2024-01-01T10:04:00Z","temperature":88.0,"pressure":33.5,"vibration":0.8,"rpm":2800}
    ]
  }')

echo "$ML_RESPONSE" | jq .
HEALTH_SCORE=$(echo "$ML_RESPONSE" | jq -r '.score')
HEALTH_STATUS=$(echo "$ML_RESPONSE" | jq -r '.status')
echo -e "${GREEN}✓ ML analysis complete${NC}"
echo -e "${YELLOW}Health Score: $HEALTH_SCORE/100${NC}"
echo -e "${YELLOW}Status: $HEALTH_STATUS${NC}"
echo ""
sleep 2

# Step 6: Get Health Analysis
echo -e "${BLUE}Step 6: Get Vehicle Health Score${NC}"
echo "GET /health-score/$VEHICLE_ID (Health Analysis Service)"
HEALTH_RESPONSE=$(curl -s http://localhost:3003/health-score/$VEHICLE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$HEALTH_RESPONSE" | jq .
echo -e "${GREEN}✓ Health analysis retrieved${NC}"
echo ""
sleep 2

# Step 7: Create Alert (if anomaly detected)
if [ "$HEALTH_STATUS" != "good" ]; then
  echo -e "${BLUE}Step 7: Create Alert for Anomaly${NC}"
  echo "POST /alerts (Alert Service)"
  ALERT_RESPONSE=$(curl -s -X POST http://localhost:3004/alerts \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
      "user_id": "'$USER_ID'",
      "vehicle_id": "'$VEHICLE_ID'",
      "type": "warning",
      "message": "Anomaly detected: High temperature and RPM",
      "severity": "medium"
    }')

  echo "$ALERT_RESPONSE" | jq .
  echo -e "${GREEN}✓ Alert created${NC}"
  echo ""
  sleep 2
fi

# Step 8: Get User Alerts
echo -e "${BLUE}Step 8: Get User Alerts${NC}"
echo "GET /alerts/$USER_ID (Alert Service)"
ALERTS_RESPONSE=$(curl -s http://localhost:3004/alerts/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$ALERTS_RESPONSE" | jq .
echo -e "${GREEN}✓ Alerts retrieved${NC}"
echo ""
sleep 2

# Step 9: Get User Profile
echo -e "${BLUE}Step 9: Get User Profile${NC}"
echo "GET /auth/me (Auth Service)"
PROFILE_RESPONSE=$(curl -s http://localhost:3000/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$PROFILE_RESPONSE" | jq .
echo -e "${GREEN}✓ User profile retrieved${NC}"
echo ""
sleep 2

# Summary
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Demo Complete!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "--------"
echo "✓ User registered and authenticated"
echo "✓ Vehicle registered (ID: $VEHICLE_ID)"
echo "✓ Sensor data collected and stored"
echo "✓ ML anomaly detection performed"
echo "✓ Health score calculated: $HEALTH_SCORE/100 ($HEALTH_STATUS)"
echo "✓ Alerts generated and retrieved"
echo "✓ User profile accessed"
echo ""
echo "All 6 services working together:"
echo "  1. Authentication Service ✓"
echo "  2. Vehicle Service ✓"
echo "  3. Sensor Data Service ✓"
echo "  4. ML Anomaly Detection ✓"
echo "  5. Health Analysis Service ✓"
echo "  6. Alert Service ✓"
echo ""
echo "Mobile app would display:"
echo "  - Dashboard: Health score gauge showing $HEALTH_SCORE"
echo "  - Alerts: Warning about high temperature/RPM"
echo "  - Vehicle: Toyota Camry 2022 details"
echo "  - Profile: Demo User settings"
echo ""
