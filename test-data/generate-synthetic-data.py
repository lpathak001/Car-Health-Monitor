#!/usr/bin/env python3
"""
Synthetic Data Generator for Car Health Monitor
Generates 1 month of realistic sensor data with various scenarios
"""

import json
import random
import datetime
from typing import List, Dict
import numpy as np

# Configuration
START_DATE = datetime.datetime.now() - datetime.timedelta(days=30)
END_DATE = datetime.datetime.now()
VEHICLES = [
    {"id": "VEH001", "make": "Toyota", "model": "Camry", "year": 2022},
    {"id": "VEH002", "make": "Honda", "model": "Accord", "year": 2021},
    {"id": "VEH003", "make": "Ford", "model": "F-150", "year": 2023},
    {"id": "VEH004", "make": "Tesla", "model": "Model 3", "year": 2023},
    {"id": "VEH005", "make": "BMW", "model": "X5", "year": 2022},
]

USERS = [
    {"id": "USR001", "email": "john.doe@example.com", "name": "John Doe"},
    {"id": "USR002", "email": "jane.smith@example.com", "name": "Jane Smith"},
    {"id": "USR003", "email": "bob.wilson@example.com", "name": "Bob Wilson"},
    {"id": "USR004", "email": "alice.brown@example.com", "name": "Alice Brown"},
    {"id": "USR005", "email": "charlie.davis@example.com", "name": "Charlie Davis"},
]

# Normal operating ranges
NORMAL_RANGES = {
    "temperature": (75, 95),      # Fahrenheit
    "pressure": (28, 35),          # PSI
    "vibration": (0.3, 0.9),       # G-force
    "rpm": (800, 3500),            # RPM
    "speed": (0, 75),              # MPH
    "fuel_level": (10, 100),       # Percentage
    "battery_voltage": (12.4, 14.8), # Volts
    "oil_pressure": (20, 65),      # PSI
}

# Anomaly scenarios
ANOMALY_SCENARIOS = [
    {
        "name": "overheating",
        "probability": 0.02,
        "modifications": {"temperature": (150, 180), "rpm": (4000, 5500)}
    },
    {
        "name": "low_oil_pressure",
        "probability": 0.015,
        "modifications": {"oil_pressure": (5, 15), "temperature": (100, 120)}
    },
    {
        "name": "high_vibration",
        "probability": 0.025,
        "modifications": {"vibration": (2.0, 4.0), "rpm": (3000, 4500)}
    },
    {
        "name": "battery_issue",
        "probability": 0.01,
        "modifications": {"battery_voltage": (10.5, 12.0)}
    },
    {
        "name": "tire_pressure_low",
        "probability": 0.03,
        "modifications": {"pressure": (15, 25)}
    },
]

def generate_sensor_reading(vehicle_id: str, timestamp: datetime.datetime, 
                           is_anomaly: bool = False, anomaly_type: str = None) -> Dict:
    """Generate a single sensor reading"""
    
    # Base reading with normal values
    reading = {
        "vehicle_id": vehicle_id,
        "timestamp": timestamp.isoformat() + "Z",
        "temperature": random.uniform(*NORMAL_RANGES["temperature"]),
        "pressure": random.uniform(*NORMAL_RANGES["pressure"]),
        "vibration": random.uniform(*NORMAL_RANGES["vibration"]),
        "rpm": random.uniform(*NORMAL_RANGES["rpm"]),
        "speed": random.uniform(*NORMAL_RANGES["speed"]),
        "fuel_level": random.uniform(*NORMAL_RANGES["fuel_level"]),
        "battery_voltage": random.uniform(*NORMAL_RANGES["battery_voltage"]),
        "oil_pressure": random.uniform(*NORMAL_RANGES["oil_pressure"]),
    }
    
    # Apply anomaly if specified
    if is_anomaly and anomaly_type:
        for scenario in ANOMALY_SCENARIOS:
            if scenario["name"] == anomaly_type:
                for key, value_range in scenario["modifications"].items():
                    reading[key] = random.uniform(*value_range)
                reading["anomaly_type"] = anomaly_type
                break
    
    # Add some correlation (speed affects RPM, temperature, etc.)
    if reading["speed"] > 50:
        reading["rpm"] = max(reading["rpm"], 2000 + reading["speed"] * 20)
        reading["temperature"] += random.uniform(5, 15)
    
    # Round values
    for key in reading:
        if isinstance(reading[key], float) and key != "timestamp":
            reading[key] = round(reading[key], 2)
    
    return reading

def generate_trip(vehicle_id: str, start_time: datetime.datetime, 
                 duration_minutes: int) -> List[Dict]:
    """Generate sensor readings for a complete trip"""
    readings = []
    current_time = start_time
    interval_seconds = 60  # 1 reading per minute
    
    # Determine if this trip will have anomalies
    has_anomaly = random.random() < 0.15  # 15% of trips have anomalies
    anomaly_type = None
    anomaly_start = None
    
    if has_anomaly:
        # Choose random anomaly type
        anomaly_type = random.choice(ANOMALY_SCENARIOS)["name"]
        # Anomaly occurs randomly during trip
        anomaly_start = random.randint(5, max(6, duration_minutes - 10))
    
    for minute in range(duration_minutes):
        is_anomaly = has_anomaly and minute >= anomaly_start and minute < anomaly_start + 5
        
        reading = generate_sensor_reading(
            vehicle_id, 
            current_time,
            is_anomaly=is_anomaly,
            anomaly_type=anomaly_type if is_anomaly else None
        )
        readings.append(reading)
        current_time += datetime.timedelta(seconds=interval_seconds)
    
    return readings

def generate_daily_trips(vehicle_id: str, date: datetime.datetime) -> List[Dict]:
    """Generate trips for a single day"""
    all_readings = []
    
    # Random number of trips per day (0-4)
    num_trips = random.choices([0, 1, 2, 3, 4], weights=[0.1, 0.3, 0.35, 0.2, 0.05])[0]
    
    # Common trip times
    trip_times = [
        (7, 30),   # Morning commute
        (12, 0),   # Lunch
        (17, 30),  # Evening commute
        (19, 0),   # Evening errands
    ]
    
    for i in range(num_trips):
        hour, minute = trip_times[i] if i < len(trip_times) else (random.randint(8, 20), random.randint(0, 59))
        start_time = date.replace(hour=hour, minute=minute, second=0)
        
        # Trip duration: 10-60 minutes
        duration = random.randint(10, 60)
        
        trip_readings = generate_trip(vehicle_id, start_time, duration)
        all_readings.extend(trip_readings)
    
    return all_readings

def generate_month_data() -> Dict:
    """Generate complete month of data for all vehicles"""
    all_data = {
        "metadata": {
            "generated_at": datetime.datetime.now().isoformat(),
            "start_date": START_DATE.isoformat(),
            "end_date": END_DATE.isoformat(),
            "total_vehicles": len(VEHICLES),
            "total_users": len(USERS),
        },
        "vehicles": VEHICLES,
        "users": USERS,
        "sensor_readings": [],
        "statistics": {}
    }
    
    # Generate data for each vehicle
    current_date = START_DATE
    total_readings = 0
    total_anomalies = 0
    
    while current_date <= END_DATE:
        for vehicle in VEHICLES:
            daily_readings = generate_daily_trips(vehicle["id"], current_date)
            all_data["sensor_readings"].extend(daily_readings)
            total_readings += len(daily_readings)
            total_anomalies += sum(1 for r in daily_readings if "anomaly_type" in r)
        
        current_date += datetime.timedelta(days=1)
    
    # Calculate statistics
    all_data["statistics"] = {
        "total_readings": total_readings,
        "total_anomalies": total_anomalies,
        "anomaly_rate": round(total_anomalies / total_readings * 100, 2) if total_readings > 0 else 0,
        "readings_per_vehicle": round(total_readings / len(VEHICLES), 2),
        "days_covered": (END_DATE - START_DATE).days + 1,
    }
    
    return all_data

def generate_test_scenarios() -> Dict:
    """Generate specific test scenarios"""
    scenarios = {
        "load_testing": {
            "description": "High volume concurrent requests",
            "readings": []
        },
        "edge_cases": {
            "description": "Boundary values and extreme conditions",
            "readings": []
        },
        "performance_testing": {
            "description": "Large batch processing",
            "readings": []
        }
    }
    
    # Load testing: 1000 concurrent readings
    timestamp = datetime.datetime.now()
    for i in range(1000):
        scenarios["load_testing"]["readings"].append(
            generate_sensor_reading(f"VEH{i%5+1:03d}", timestamp)
        )
    
    # Edge cases
    edge_timestamp = datetime.datetime.now()
    edge_cases = [
        {"temperature": 0, "pressure": 0, "vibration": 0, "rpm": 0},  # All zeros
        {"temperature": 250, "pressure": 100, "vibration": 10, "rpm": 8000},  # All max
        {"temperature": -40, "pressure": 5, "vibration": 0.01, "rpm": 500},  # All min
    ]
    
    for i, case in enumerate(edge_cases):
        reading = generate_sensor_reading(f"VEH001", edge_timestamp)
        reading.update(case)
        scenarios["edge_cases"]["readings"].append(reading)
    
    # Performance testing: 10000 readings
    perf_timestamp = datetime.datetime.now()
    for i in range(10000):
        scenarios["performance_testing"]["readings"].append(
            generate_sensor_reading(f"VEH{i%5+1:03d}", perf_timestamp + datetime.timedelta(seconds=i))
        )
    
    return scenarios

if __name__ == "__main__":
    print("🚗 Generating synthetic car sensor data...")
    print(f"📅 Date range: {START_DATE.date()} to {END_DATE.date()}")
    print(f"🚙 Vehicles: {len(VEHICLES)}")
    print()
    
    # Generate main dataset
    print("Generating main dataset...")
    main_data = generate_month_data()
    
    with open("test-data/synthetic_data_full.json", "w") as f:
        json.dump(main_data, f, indent=2)
    
    print(f"✅ Generated {main_data['statistics']['total_readings']:,} sensor readings")
    print(f"⚠️  Anomalies: {main_data['statistics']['total_anomalies']} ({main_data['statistics']['anomaly_rate']}%)")
    print()
    
    # Generate test scenarios
    print("Generating test scenarios...")
    test_scenarios = generate_test_scenarios()
    
    with open("test-data/test_scenarios.json", "w") as f:
        json.dump(test_scenarios, f, indent=2)
    
    print(f"✅ Load testing: {len(test_scenarios['load_testing']['readings'])} readings")
    print(f"✅ Edge cases: {len(test_scenarios['edge_cases']['readings'])} readings")
    print(f"✅ Performance: {len(test_scenarios['performance_testing']['readings'])} readings")
    print()
    
    # Generate summary statistics
    print("📊 Summary Statistics:")
    print(f"   Total readings: {main_data['statistics']['total_readings']:,}")
    print(f"   Readings per vehicle: {main_data['statistics']['readings_per_vehicle']:,.0f}")
    print(f"   Days covered: {main_data['statistics']['days_covered']}")
    print(f"   Anomaly rate: {main_data['statistics']['anomaly_rate']}%")
    print()
    print("✅ Data generation complete!")
    print("📁 Files created:")
    print("   - test-data/synthetic_data_full.json")
    print("   - test-data/test_scenarios.json")
