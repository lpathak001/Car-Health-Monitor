# 📊 Datasets Overview

## Available Datasets

The Car Health Monitor project includes two comprehensive synthetic datasets for different purposes.

---

## 1. Monthly Dataset (Testing & Development)

**File**: `test-data/synthetic_data_full.json` (2.8 MB)

### Purpose
- Functional testing
- Stability testing
- Performance testing
- Development and debugging

### Statistics
- **Total Readings**: 9,682
- **Anomalies**: 239 (2.47%)
- **Date Range**: 31 days (Feb 3 - Mar 5, 2026)
- **Vehicles**: 5
- **Users**: 5
- **File Size**: 2.8 MB

### Use Cases
- Quick testing and validation
- Development environment
- Unit and integration tests
- Performance benchmarks
- ML model training (baseline)

### Generation
```bash
python3 test-data/generate-synthetic-data.py
```

### Documentation
- `test-data/TEST_DATA_SUMMARY.md`
- `test-data/TEST_RESULTS.md`

---

## 2. Yearly Dataset (Customer Demos)

**File**: `test-data/synthetic_data_yearly.json` (27 MB)

### Purpose
- Customer demonstrations
- Sales presentations
- Long-term trend analysis
- Seasonal pattern analysis
- Production simulation

### Statistics
- **Total Readings**: 75,470
- **Anomalies**: 54 (0.07%)
- **Date Range**: 365 days (Mar 5, 2025 - Mar 5, 2026)
- **Vehicles**: 5
- **Users**: 5
- **Trips**: 1,533
- **File Size**: 27 MB

### Use Cases
- Customer demos (4 scenarios)
- Long-term health tracking
- Seasonal analysis
- Fleet management demos
- ROI calculations
- Predictive maintenance demos

### Generation
```bash
python3 test-data/generate-yearly-data.py
```

### Documentation
- `test-data/YEARLY_DATA_SUMMARY.md`
- `CUSTOMER_DEMO_GUIDE.md`
- `DEMO_QUICK_REFERENCE.md`
- `YEARLY_DATA_COMPLETE.md`

---

## Comparison

| Feature | Monthly Dataset | Yearly Dataset |
|---------|----------------|----------------|
| **Readings** | 9,682 | 75,470 |
| **Duration** | 31 days | 365 days |
| **Anomalies** | 239 (2.47%) | 54 (0.07%) |
| **File Size** | 2.8 MB | 27 MB |
| **Purpose** | Testing | Demos |
| **Anomaly Rate** | Higher (testing) | Realistic (production) |
| **Load Time** | <1 sec | <2 sec |
| **Best For** | Development | Sales/Demos |

---

## Fleet Details (Both Datasets)

### 1. Toyota Camry 2022 (VEH-2022-001)
- **Owner**: John Smith
- **Pattern**: Commuter (regular daily commute)
- **Mileage**: 15,000 miles (start)

### 2. Honda Accord 2021 (VEH-2021-002)
- **Owner**: Sarah Johnson
- **Pattern**: Frequent (heavy usage)
- **Mileage**: 28,000 miles (start)

### 3. Tesla Model 3 2023 (VEH-2023-003)
- **Owner**: Mike Chen
- **Pattern**: Light (weekend driver)
- **Mileage**: 5,000 miles (start)

### 4. Ford F-150 2020 (VEH-2020-004)
- **Owner**: Lisa Rodriguez
- **Pattern**: Work Truck (heavy loads)
- **Mileage**: 45,000 miles (start)

### 5. BMW X5 2019 (VEH-2019-005)
- **Owner**: David Williams
- **Pattern**: Luxury (well-maintained)
- **Mileage**: 32,000 miles (start)

---

## Sensor Parameters (Both Datasets)

All readings include 8 sensor parameters:

1. **Temperature** (°F) - Engine temperature
2. **Pressure** (PSI) - Tire pressure
3. **Vibration** (G-force) - Engine/chassis vibration
4. **RPM** - Engine revolutions per minute
5. **Speed** (mph) - Vehicle speed
6. **Fuel Level** (%) - Remaining fuel
7. **Battery Voltage** (V) - Electrical system
8. **Oil Pressure** (PSI) - Engine lubrication

---

## Anomaly Types (Both Datasets)

Both datasets include 6 types of anomalies:

1. **Overheating** - Temperature >150°F
2. **Low Oil Pressure** - Oil pressure <15 PSI
3. **High Vibration** - Vibration >2.0 G-force
4. **Battery Issue** - Voltage <12.0V
5. **Low Tire Pressure** - Pressure <25 PSI
6. **Low Fuel** - Fuel level <8%

---

## Data Format (Both Datasets)

### JSON Structure
```json
{
  "metadata": {
    "generated_at": "2026-03-05T...",
    "start_date": "...",
    "end_date": "...",
    "total_days": 31 or 365,
    "num_vehicles": 5,
    "num_users": 5
  },
  "vehicles": [
    {
      "id": "VEH-2022-001",
      "make": "Toyota",
      "model": "Camry",
      "year": 2022,
      "vin": "1HGBH41JXMN109186",
      "usage_pattern": "commuter",
      "mileage_start": 15000,
      "owner": "user-001"
    }
  ],
  "users": [
    {
      "id": "user-001",
      "email": "john.smith@example.com",
      "name": "John Smith"
    }
  ],
  "readings": [
    {
      "vehicle_id": "VEH-2022-001",
      "user_id": "user-001",
      "timestamp": "2025-03-05T08:15:00",
      "temperature": 85.5,
      "pressure": 32.0,
      "vibration": 0.5,
      "rpm": 2500,
      "speed": 65,
      "fuel_level": 75.0,
      "battery_voltage": 13.8,
      "oil_pressure": 45.0,
      "is_anomaly": false,
      "anomaly_type": null
    }
  ],
  "statistics": {
    "total_readings": 9682 or 75470,
    "total_anomalies": 239 or 54,
    "anomaly_rate": 2.47 or 0.07,
    "readings_per_vehicle": {...},
    "anomalies_per_type": {...},
    "trips_per_vehicle": {...}
  }
}
```

---

## Loading Data

### Python
```python
import json

# Load monthly data
with open('test-data/synthetic_data_full.json', 'r') as f:
    monthly_data = json.load(f)

# Load yearly data
with open('test-data/synthetic_data_yearly.json', 'r') as f:
    yearly_data = json.load(f)

print(f"Monthly: {len(monthly_data['readings'])} readings")
print(f"Yearly: {len(yearly_data['readings'])} readings")
```

### Node.js
```javascript
const fs = require('fs');

// Load monthly data
const monthlyData = JSON.parse(
  fs.readFileSync('test-data/synthetic_data_full.json', 'utf8')
);

// Load yearly data
const yearlyData = JSON.parse(
  fs.readFileSync('test-data/synthetic_data_yearly.json', 'utf8')
);

console.log(`Monthly: ${monthlyData.readings.length} readings`);
console.log(`Yearly: ${yearlyData.readings.length} readings`);
```

---

## When to Use Which Dataset

### Use Monthly Dataset When:
- ✅ Running automated tests
- ✅ Developing new features
- ✅ Debugging issues
- ✅ Quick validation needed
- ✅ Limited resources (smaller file)
- ✅ Testing ML algorithms
- ✅ Performance benchmarking

### Use Yearly Dataset When:
- ✅ Delivering customer demos
- ✅ Sales presentations
- ✅ Showing long-term trends
- ✅ Analyzing seasonal patterns
- ✅ Demonstrating ROI
- ✅ Fleet management scenarios
- ✅ Executive presentations

---

## Demo Scripts

### Monthly Data Demo
```bash
# Run standard demo workflow
./demo-workflow.sh
```

### Yearly Data Demo
```bash
# Run customer demo (4 scenarios)
./customer-demo.sh

# Select scenario:
# 1. Quick Overview (5 min)
# 2. Fleet Manager Demo (15 min)
# 3. Technical Deep Dive (30 min)
# 4. Executive Summary (3 min)
```

---

## Regenerating Data

### Regenerate Monthly Data
```bash
python3 test-data/generate-synthetic-data.py
```

### Regenerate Yearly Data
```bash
python3 test-data/generate-yearly-data.py
```

---

## File Locations

```
test-data/
├── synthetic_data_full.json          # Monthly dataset (2.8 MB)
├── synthetic_data_yearly.json        # Yearly dataset (27 MB)
├── generate-synthetic-data.py        # Monthly generator
├── generate-yearly-data.py           # Yearly generator
├── TEST_DATA_SUMMARY.md              # Monthly docs
├── YEARLY_DATA_SUMMARY.md            # Yearly docs
├── TEST_RESULTS.md                   # Test results
└── [validation scripts]
```

---

## Quality Assurance

### Both Datasets Include:
✅ Realistic sensor values  
✅ Seasonal variations  
✅ Time-of-day patterns  
✅ Weekday/weekend differences  
✅ Vehicle-specific usage patterns  
✅ Correlated sensor readings  
✅ Proper anomaly distribution  
✅ No duplicate readings  
✅ Valid JSON formatting  
✅ Complete metadata

---

## Performance

| Metric | Monthly | Yearly |
|--------|---------|--------|
| **File Size** | 2.8 MB | 27 MB |
| **Load Time** | <1 sec | <2 sec |
| **Parse Time** | <0.5 sec | <1 sec |
| **Memory Usage** | ~50 MB | ~200 MB |
| **Query Time** | <50ms | <100ms |

---

## Support

### Documentation
- Monthly: `test-data/TEST_DATA_SUMMARY.md`
- Yearly: `test-data/YEARLY_DATA_SUMMARY.md`
- Demos: `CUSTOMER_DEMO_GUIDE.md`
- Quick Ref: `DEMO_QUICK_REFERENCE.md`

### Scripts
- Monthly demo: `./demo-workflow.sh`
- Yearly demo: `./customer-demo.sh`
- Tests: `test-data/run-tests.sh`

---

## Summary

Two comprehensive datasets available:

1. **Monthly Dataset** (2.8 MB, 9,682 readings)
   - For testing and development
   - Higher anomaly rate for testing edge cases
   - Quick to load and process

2. **Yearly Dataset** (27 MB, 75,470 readings)
   - For customer demonstrations
   - Realistic anomaly rate (production-like)
   - Shows long-term trends and patterns

Both datasets are production-grade quality with realistic patterns, seasonal variations, and proper anomaly distributions.

---

**Choose the right dataset for your use case!** 🎯
