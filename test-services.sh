#!/bin/bash

echo "=== Testing Analytics & Predictive Maintenance Services ==="
echo ""

# Create a test user
echo "1. Creating test user..."
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@analytics.com",
    "password": "TestPass123!",
    "name": "Test User"
  }')
echo "$USER_RESPONSE" | head -c 200
echo ""
echo ""

# Extract user ID (assuming it's in the response)
USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "User ID: $USER_ID"
echo ""

# Create a test vehicle
echo "2. Creating test vehicle..."
VEHICLE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/vehicles \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"make\": \"Toyota\",
    \"model\": \"Camry\",
    \"year\": 2022,
    \"vin\": \"TEST123456789\",
    \"license_plate\": \"TEST001\",
    \"color\": \"Blue\"
  }")
echo "$VEHICLE_RESPONSE" | head -c 200
echo ""
echo ""

# Extract vehicle ID
VEHICLE_ID=$(echo "$VEHICLE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Vehicle ID: $VEHICLE_ID"
echo ""

# Add sample sensor data
echo "3. Adding sample sensor readings..."
for i in {1..10}; do
  TEMP=$((75 + RANDOM % 30))
  OIL=$((40 + RANDOM % 20))
  BATTERY=$((13 + RANDOM % 2))
  VIBRATION=$(echo "scale=2; $RANDOM / 32768" | bc)
  RPM=$((1000 + RANDOM % 3000))
  SPEED=$((20 + RANDOM % 60))
  
  curl -s -X POST http://localhost:3002/api/sensor-data \
    -H "Content-Type: application/json" \
    -d "{
      \"vehicle_id\": \"$VEHICLE_ID\",
      \"temperature\": $TEMP,
      \"oil_pressure\": $OIL,
      \"battery_voltage\": $BATTERY,
      \"vibration\": $VIBRATION,
      \"rpm\": $RPM,
      \"speed\": $SPEED
    }" > /dev/null
  echo "  Added reading $i"
done
echo ""

# Test Analytics Service
echo "4. Testing Analytics Service..."
echo ""
echo "   a) Fleet Health Summary:"
curl -s http://localhost:3007/api/analytics/fleet-health | jq . | head -20
echo ""
echo ""

echo "   b) Vehicle Trends (last 30 days):"
curl -s "http://localhost:3007/api/analytics/vehicle/$VEHICLE_ID/trends?days=30" | jq . | head -20
echo ""
echo ""

echo "   c) Anomaly Analysis:"
curl -s "http://localhost:3007/api/analytics/anomalies?days=30" | jq . | head -20
echo ""
echo ""

echo "   d) Cost Analysis:"
curl -s "http://localhost:3007/api/analytics/cost-analysis?period=month" | jq . | head -20
echo ""
echo ""

# Test Predictive Maintenance Service
echo "5. Testing Predictive Maintenance Service..."
echo ""
echo "   a) Component Failure Predictions:"
curl -s "http://localhost:3006/api/predictive/component-failures/$VEHICLE_ID" | jq . | head -20
echo ""
echo ""

echo "   b) Maintenance Schedule:"
curl -s "http://localhost:3006/api/predictive/maintenance-schedule/$VEHICLE_ID" | jq . | head -20
echo ""
echo ""

echo "   c) Remaining Useful Life (RUL):"
curl -s "http://localhost:3006/api/predictive/rul/$VEHICLE_ID" | jq . | head -20
echo ""
echo ""

echo "   d) Parts Inventory Recommendations:"
curl -s "http://localhost:3006/api/predictive/parts-inventory" | jq . | head -20
echo ""
echo ""

echo "=== Test Complete ==="
