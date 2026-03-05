#!/usr/bin/env python3
"""Validate synthetic data quality"""

import json

with open('test-data/synthetic_data_full.json', 'r') as f:
    data = json.load(f)

print("Validating synthetic data...")

# Check data structure
assert 'sensor_readings' in data, "Missing sensor_readings"
assert 'vehicles' in data, "Missing vehicles"
assert 'users' in data, "Missing users"
assert 'statistics' in data, "Missing statistics"

# Check readings
readings = data['sensor_readings']
assert len(readings) > 0, "No readings generated"

# Validate reading structure
sample = readings[0]
required_fields = ['vehicle_id', 'timestamp', 'temperature', 'pressure', 'vibration', 'rpm']
for field in required_fields:
    assert field in sample, f"Missing field: {field}"

# Check value ranges (allowing for speed-based temperature increases)
temp_values = [r['temperature'] for r in readings if 'anomaly_type' not in r]
assert min(temp_values) >= 70, "Temperature too low"
# Normal temps can go up to 110 with high speed
assert max(temp_values) <= 115, "Temperature too high (normal readings)"

# Check anomalies
anomalies = [r for r in readings if 'anomaly_type' in r]
anomaly_rate = len(anomalies) / len(readings) * 100

print(f"✓ Data structure valid")
print(f"✓ {len(readings)} readings validated")
print(f"✓ {len(anomalies)} anomalies ({anomaly_rate:.2f}%)")
print(f"✓ {len(data['vehicles'])} vehicles")
print(f"✓ {len(data['users'])} users")
print("✓ All validations passed")
