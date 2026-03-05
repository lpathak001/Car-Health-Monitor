# 🧪 Synthetic Test Data - Summary Report

## Overview

Generated comprehensive synthetic data for **1 month** of car operations covering functional, stability, and performance testing scenarios.

---

## 📊 Dataset Statistics

### Main Dataset (`synthetic_data_full.json`)
- **Total Sensor Readings**: 9,682
- **Date Range**: February 3, 2026 - March 5, 2026 (31 days)
- **Vehicles**: 5 vehicles
- **Users**: 5 users
- **Anomalies**: 239 (2.47% anomaly rate)
- **Readings per Vehicle**: ~1,936 average

### Test Scenarios (`test_scenarios.json`)
- **Load Testing**: 1,000 concurrent readings
- **Edge Cases**: 3 boundary condition scenarios
- **Performance Testing**: 10,000 sequential readings

---

## 🚗 Vehicle Fleet

| Vehicle ID | Make | Model | Year |
|------------|------|-------|------|
| VEH001 | Toyota | Camry | 2022 |
| VEH002 | Honda | Accord | 2021 |
| VEH003 | Ford | F-150 | 2023 |
| VEH004 | Tesla | Model 3 | 2023 |
| VEH005 | BMW | X5 | 2022 |

---

## 👥 Test Users

| User ID | Name | Email |
|---------|------|-------|
| USR001 | John Doe | john.doe@example.com |
| USR002 | Jane Smith | jane.smith@example.com |
| USR003 | Bob Wilson | bob.wilson@example.com |
| USR004 | Alice Brown | alice.brown@example.com |
| USR005 | Charlie Davis | charlie.davis@example.com |

---

## 📈 Sensor Data Parameters

### Normal Operating Ranges

| Parameter | Min | Max | Unit |
|-----------|-----|-----|------|
| Temperature | 75 | 95 | °F |
| Tire Pressure | 28 | 35 | PSI |
| Vibration | 0.3 | 0.9 | G-force |
| RPM | 800 | 3,500 | RPM |
| Speed | 0 | 75 | MPH |
| Fuel Level | 10 | 100 | % |
| Battery Voltage | 12.4 | 14.8 | V |
| Oil Pressure | 20 | 65 | PSI |

---

## ⚠️ Anomaly Scenarios

### 1. Overheating (2% probability)
- **Temperature**: 150-180°F
- **RPM**: 4,000-5,500
- **Impact**: Critical health score reduction

### 2. Low Oil Pressure (1.5% probability)
- **Oil Pressure**: 5-15 PSI
- **Temperature**: 100-120°F
- **Impact**: Engine damage risk

### 3. High Vibration (2.5% probability)
- **Vibration**: 2.0-4.0 G-force
- **RPM**: 3,000-4,500
- **Impact**: Mechanical issue indicator

### 4. Battery Issue (1% probability)
- **Battery Voltage**: 10.5-12.0V
- **Impact**: Starting problems

### 5. Low Tire Pressure (3% probability)
- **Pressure**: 15-25 PSI
- **Impact**: Safety and efficiency

---

## 🎯 Test Coverage

### Functional Tests
- ✅ User registration and authentication
- ✅ Vehicle registration
- ✅ Sensor data ingestion
- ✅ ML anomaly detection
- ✅ Health score calculation
- ✅ Alert generation

### Stability Tests
- ✅ Service health checks
- ✅ Database connectivity
- ✅ Redis caching
- ✅ Long-running operations
- ✅ Error recovery

### Performance Tests
- ✅ Load testing (1,000 concurrent requests)
- ✅ Batch processing (10,000 readings)
- ✅ Response time benchmarks
- ✅ Throughput measurements
- ✅ Resource utilization

---

## 📁 Data Files

### 1. `synthetic_data_full.json` (Main Dataset)
```json
{
  "metadata": {
    "generated_at": "2026-03-05T...",
    "start_date": "2026-02-03",
    "end_date": "2026-03-05",
    "total_vehicles": 5,
    "total_users": 5
  },
  "vehicles": [...],
  "users": [...],
  "sensor_readings": [
    {
      "vehicle_id": "VEH001",
      "timestamp": "2026-02-03T07:30:00Z",
      "temperature": 85.5,
      "pressure": 32.0,
      "vibration": 0.5,
      "rpm": 2500,
      "speed": 45,
      "fuel_level": 75,
      "battery_voltage": 13.8,
      "oil_pressure": 45
    }
  ],
  "statistics": {...}
}
```

### 2. `test_scenarios.json` (Test Cases)
```json
{
  "load_testing": {
    "description": "High volume concurrent requests",
    "readings": [...]  // 1000 readings
  },
  "edge_cases": {
    "description": "Boundary values",
    "readings": [...]  // 3 edge cases
  },
  "performance_testing": {
    "description": "Large batch processing",
    "readings": [...]  // 10000 readings
  }
}
```

---

## 🔬 Usage Examples

### Load Synthetic Data
```python
import json

with open('test-data/synthetic_data_full.json', 'r') as f:
    data = json.load(f)

# Get all readings
readings = data['sensor_readings']

# Filter anomalies
anomalies = [r for r in readings if 'anomaly_type' in r]

# Get readings for specific vehicle
veh001_readings = [r for r in readings if r['vehicle_id'] == 'VEH001']
```

### Test ML Service
```bash
# Analyze batch of readings
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d @test-data/batch_sample.json
```

### Run All Tests
```bash
chmod +x test-data/run-tests.sh
./test-data/run-tests.sh
```

---

## 📊 Expected Test Results

### ML Anomaly Detection
- **Precision**: ~85-95% (depends on model training)
- **Recall**: ~80-90%
- **False Positive Rate**: <10%
- **Processing Time**: <200ms per batch of 50 readings

### Performance Benchmarks
- **API Response Time**: <100ms (95th percentile)
- **Throughput**: >100 requests/second
- **Batch Processing**: >50 readings/second
- **Database Queries**: <50ms average

### Stability Metrics
- **Uptime**: 99.9%
- **Error Rate**: <0.1%
- **Recovery Time**: <5 seconds
- **Memory Usage**: <500MB per service

---

## 🎯 Test Scenarios

### Scenario 1: Normal Operations
- **Duration**: 7 days
- **Trips per day**: 2-3
- **Expected**: No anomalies, health score 90-100

### Scenario 2: Gradual Degradation
- **Duration**: 14 days
- **Pattern**: Increasing temperature over time
- **Expected**: Health score declining from 95 to 75

### Scenario 3: Critical Failure
- **Duration**: 1 day
- **Pattern**: Sudden overheating + low oil pressure
- **Expected**: Health score drops to <50, critical alerts

### Scenario 4: Intermittent Issues
- **Duration**: 30 days
- **Pattern**: Random anomalies (2-3% of readings)
- **Expected**: Health score 70-85, periodic warnings

### Scenario 5: Load Testing
- **Duration**: Instant
- **Pattern**: 1000 concurrent requests
- **Expected**: All requests processed, <5% error rate

---

## 🚀 Running Tests

### 1. Generate Data
```bash
python3 test-data/generate-synthetic-data.py
```

### 2. Validate Data
```bash
python3 test-data/validate-data.py
```

### 3. Run Test Suite
```bash
./test-data/run-tests.sh
```

### 4. Performance Test
```bash
python3 test-data/batch-test.py
```

### 5. ML Accuracy Test
```bash
python3 test-data/test-ml-accuracy.py
```

---

## 📈 Data Distribution

### Trips per Day
- 0 trips: 10%
- 1 trip: 30%
- 2 trips: 35%
- 3 trips: 20%
- 4 trips: 5%

### Trip Duration
- Short (10-20 min): 40%
- Medium (20-40 min): 40%
- Long (40-60 min): 20%

### Anomaly Distribution
- Overheating: 2.0%
- Low Oil Pressure: 1.5%
- High Vibration: 2.5%
- Battery Issues: 1.0%
- Low Tire Pressure: 3.0%

---

## ✅ Quality Assurance

### Data Validation Checks
- ✅ All required fields present
- ✅ Values within realistic ranges
- ✅ Timestamps in chronological order
- ✅ Vehicle IDs match fleet
- ✅ Anomaly rates within expected bounds
- ✅ Correlations between parameters (speed/RPM)

### Test Coverage
- ✅ Unit tests: All services
- ✅ Integration tests: Service communication
- ✅ Load tests: 1000+ concurrent requests
- ✅ Performance tests: 10,000+ readings
- ✅ Edge cases: Boundary conditions
- ✅ Anomaly detection: Known anomalies

---

## 🎉 Summary

**Comprehensive synthetic dataset ready for:**
- Functional testing of all services
- Stability testing under various conditions
- Performance benchmarking and optimization
- ML model training and validation
- Load testing and scalability assessment
- Edge case and boundary condition testing

**Total Test Coverage**: 9,682 normal readings + 11,003 test scenarios = **20,685 data points**
