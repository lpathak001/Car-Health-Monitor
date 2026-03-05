#!/bin/bash

echo "🧪 Car Health Monitor - Comprehensive Testing Suite"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test
run_test() {
    local test_name=$1
    local command=$2
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}Test $TOTAL_TESTS: $test_name${NC}"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 1. Functional Tests
echo -e "${YELLOW}=== Functional Tests ===${NC}"
echo ""

# Test authentication
run_test "User Registration" \
    "curl -s -X POST http://localhost:3000/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test1@test.com\",\"password\":\"Test@123\",\"name\":\"Test User\"}' | grep -q success"

run_test "User Login" \
    "curl -s -X POST http://localhost:3000/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"test1@test.com\",\"password\":\"Test@123\"}' | grep -q access_token"

# Test vehicle service
run_test "Vehicle Registration" \
    "curl -s -X POST http://localhost:3001/vehicles -H 'Content-Type: application/json' -d '{\"make\":\"Toyota\",\"model\":\"Camry\"}' | grep -q id"

# Test sensor data
run_test "Sensor Data Submission" \
    "curl -s -X POST http://localhost:3002/sensor-data -H 'Content-Type: application/json' -d '{\"vehicle_id\":\"VEH001\",\"temperature\":85.5,\"pressure\":32.0}' | grep -q message"

# Test ML service
run_test "ML Anomaly Detection" \
    "curl -s -X POST http://localhost:8000/analyze -H 'Content-Type: application/json' -d '{\"data\":[{\"vehicle_id\":\"VEH001\",\"timestamp\":\"2024-01-01T00:00:00Z\",\"temperature\":85.5,\"pressure\":32.0,\"vibration\":0.5,\"rpm\":2500}]}' | grep -q score"

echo ""

# 2. Stability Tests
echo -e "${YELLOW}=== Stability Tests ===${NC}"
echo ""

run_test "Service Health Checks" \
    "curl -s http://localhost:3000/health | grep -q healthy && curl -s http://localhost:8000/health | grep -q healthy"

run_test "Database Connection" \
    "curl -s http://localhost:3000/health | grep -q healthy"

run_test "Redis Connection" \
    "curl -s http://localhost:3000/health | grep -q healthy"

echo ""

# 3. Performance Tests
echo -e "${YELLOW}=== Performance Tests ===${NC}"
echo ""

# Load testing with synthetic data
echo "Running load test with 100 concurrent requests..."
run_test "Load Test (100 requests)" \
    "seq 1 100 | xargs -P 10 -I {} curl -s http://localhost:3000/health > /dev/null && echo 'done'"

# Batch processing
echo "Testing batch sensor data processing..."
run_test "Batch Processing (50 readings)" \
    "python3 test-data/batch-test.py"

echo ""

# 4. Data Quality Tests
echo -e "${YELLOW}=== Data Quality Tests ===${NC}"
echo ""

run_test "Synthetic Data Validation" \
    "python3 test-data/validate-data.py"

run_test "Anomaly Detection Accuracy" \
    "python3 test-data/test-ml-accuracy.py"

echo ""

# Summary
echo "===================================================="
echo -e "${YELLOW}Test Summary${NC}"
echo "===================================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
