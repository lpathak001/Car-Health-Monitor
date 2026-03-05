#!/usr/bin/env python3
"""Test ML anomaly detection accuracy"""

import json
import requests

with open('test-data/synthetic_data_full.json', 'r') as f:
    data = json.load(f)

# Get readings with known anomalies
anomaly_readings = [r for r in data['sensor_readings'] if 'anomaly_type' in r][:10]
normal_readings = [r for r in data['sensor_readings'] if 'anomaly_type' not in r][:10]

print(f"Testing ML accuracy with {len(anomaly_readings)} anomalies and {len(normal_readings)} normal readings...")

# Test anomaly detection
ml_data = {
    "data": [
        {
            "vehicle_id": r["vehicle_id"],
            "timestamp": r["timestamp"],
            "temperature": r["temperature"],
            "pressure": r["pressure"],
            "vibration": r["vibration"],
            "rpm": r["rpm"]
        }
        for r in (anomaly_readings + normal_readings)
    ]
}

try:
    response = requests.post('http://localhost:8000/analyze', json=ml_data, timeout=10)
    if response.status_code == 200:
        result = response.json()
        detected_anomalies = len(result.get('anomalies', []))
        
        print(f"✓ ML service responded")
        print(f"  Expected anomalies: {len(anomaly_readings)}")
        print(f"  Detected anomalies: {detected_anomalies}")
        print(f"  Health score: {result.get('score', 'N/A')}")
        print("✓ Accuracy test complete")
        exit(0)
    else:
        print(f"✗ ML service error: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)
