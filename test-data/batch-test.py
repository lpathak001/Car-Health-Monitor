#!/usr/bin/env python3
"""Batch processing test using synthetic data"""

import json
import requests
import time
from statistics import mean

# Load synthetic data
with open('test-data/synthetic_data_full.json', 'r') as f:
    data = json.load(f)

# Take first 50 readings for batch test
batch_readings = data['sensor_readings'][:50]

# Prepare batch for ML service
ml_batch = {
    "data": [
        {
            "vehicle_id": r["vehicle_id"],
            "timestamp": r["timestamp"],
            "temperature": r["temperature"],
            "pressure": r["pressure"],
            "vibration": r["vibration"],
            "rpm": r["rpm"]
        }
        for r in batch_readings
    ]
}

# Test batch processing
print(f"Testing batch of {len(ml_batch['data'])} readings...")

start_time = time.time()
try:
    response = requests.post(
        'http://localhost:8000/analyze',
        json=ml_batch,
        timeout=30
    )
    end_time = time.time()
    
    if response.status_code == 200:
        result = response.json()
        processing_time = end_time - start_time
        
        print(f"✓ Batch processed successfully")
        print(f"  Processing time: {processing_time:.2f}s")
        print(f"  Throughput: {len(ml_batch['data'])/processing_time:.1f} readings/sec")
        print(f"  Health score: {result.get('score', 'N/A')}")
        exit(0)
    else:
        print(f"✗ Batch processing failed: {response.status_code}")
        exit(1)
        
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)
