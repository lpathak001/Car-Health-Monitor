#!/usr/bin/env python3
"""
Generate 1 year of synthetic car sensor data for customer demo
Includes realistic patterns, seasonal variations, and diverse scenarios
"""

import json
import random
from datetime import datetime, timedelta
from typing import List, Dict
import math

# Configuration
START_DATE = datetime(2025, 3, 5)  # 1 year ago from today
END_DATE = datetime(2026, 3, 5)    # Today
TOTAL_DAYS = 365

# Vehicle configurations
VEHICLES = [
    {
        "id": "VEH-2022-001",
        "make": "Toyota",
        "model": "Camry",
        "year": 2022,
        "vin": "1HGBH41JXMN109186",
        "usage_pattern": "commuter",  # Regular daily commute
        "mileage_start": 15000,
        "owner": "user-001"
    },
    {
        "id": "VEH-2021-002",
        "make": "Honda",
        "model": "Accord",
        "year": 2021,
        "vin": "2HGFC2F59MH123456",
        "usage_pattern": "frequent",  # Heavy usage
        "mileage_start": 28000,
        "owner": "user-002"
    },
    {
        "id": "VEH-2023-003",
        "make": "Tesla",
        "model": "Model 3",
        "year": 2023,
        "vin": "5YJ3E1EA1KF123789",
        "usage_pattern": "light",  # Weekend driver
        "mileage_start": 5000,
        "owner": "user-003"
    },
    {
        "id": "VEH-2020-004",
        "make": "Ford",
        "model": "F-150",
        "year": 2020,
        "vin": "1FTFW1E89LFA12345",
        "usage_pattern": "work_truck",  # Heavy loads, rough conditions
        "mileage_start": 45000,
        "owner": "user-004"
    },
    {
        "id": "VEH-2019-005",
        "make": "BMW",
        "model": "X5",
        "year": 2019,
        "vin": "5UXKR0C58K0P12345",
        "usage_pattern": "luxury",  # Well-maintained, moderate use
        "mileage_start": 32000,
        "owner": "user-005"
    }
]

# Users
USERS = [
    {"id": "user-001", "email": "john.smith@example.com", "name": "John Smith"},
    {"id": "user-002", "email": "sarah.johnson@example.com", "name": "Sarah Johnson"},
    {"id": "user-003", "email": "mike.chen@example.com", "name": "Mike Chen"},
    {"id": "user-004", "email": "lisa.rodriguez@example.com", "name": "Lisa Rodriguez"},
    {"id": "user-005", "email": "david.williams@example.com", "name": "David Williams"}
]

# Usage patterns (trips per week)
USAGE_PATTERNS = {
    "commuter": {"trips_per_week": 10, "avg_trip_duration": 30},
    "frequent": {"trips_per_week": 20, "avg_trip_duration": 25},
    "light": {"trips_per_week": 4, "avg_trip_duration": 45},
    "work_truck": {"trips_per_week": 15, "avg_trip_duration": 60},
    "luxury": {"trips_per_week": 8, "avg_trip_duration": 35}
}

def get_season(date: datetime) -> str:
    """Determine season based on date"""
    month = date.month
    if month in [12, 1, 2]:
        return "winter"
    elif month in [3, 4, 5]:
        return "spring"
    elif month in [6, 7, 8]:
        return "summer"
    else:
        return "fall"

def get_temperature_base(season: str, hour: int) -> float:
    """Get base temperature based on season and time of day"""
    season_temps = {
        "winter": 35,
        "spring": 60,
        "summer": 85,
        "fall": 55
    }
    base = season_temps[season]
    
    # Add daily variation (cooler at night, warmer during day)
    if 6 <= hour <= 18:
        base += 15 * math.sin((hour - 6) * math.pi / 12)
    else:
        base -= 10
    
    return base

def generate_normal_reading(vehicle: Dict, timestamp: datetime, trip_minutes: int) -> Dict:
    """Generate a normal sensor reading"""
    season = get_season(timestamp)
    hour = timestamp.hour
    
    # Base temperature varies by season and time
    temp_base = get_temperature_base(season, hour)
    
    # Engine warms up during trip
    temp_variation = min(trip_minutes * 0.5, 30)
    
    reading = {
        "vehicle_id": vehicle["id"],
        "user_id": vehicle["owner"],
        "timestamp": timestamp.isoformat(),
        "temperature": round(temp_base + temp_variation + random.uniform(-5, 5), 1),
        "pressure": round(random.uniform(30, 35), 1),
        "vibration": round(random.uniform(0.1, 0.8), 2),
        "rpm": random.randint(1500, 3500),
        "speed": random.randint(0, 75),
        "fuel_level": round(random.uniform(20, 95), 1),
        "battery_voltage": round(random.uniform(12.6, 14.4), 1),
        "oil_pressure": round(random.uniform(25, 65), 1),
        "is_anomaly": False,
        "anomaly_type": None
    }
    
    return reading

def generate_anomaly_reading(vehicle: Dict, timestamp: datetime, anomaly_type: str) -> Dict:
    """Generate an anomalous sensor reading"""
    reading = generate_normal_reading(vehicle, timestamp, 30)
    reading["is_anomaly"] = True
    reading["anomaly_type"] = anomaly_type
    
    if anomaly_type == "overheating":
        reading["temperature"] = round(random.uniform(150, 180), 1)
        reading["rpm"] = random.randint(4000, 6000)
    elif anomaly_type == "low_oil_pressure":
        reading["oil_pressure"] = round(random.uniform(5, 14), 1)
        reading["temperature"] = round(random.uniform(110, 130), 1)
    elif anomaly_type == "high_vibration":
        reading["vibration"] = round(random.uniform(2.0, 4.5), 2)
        reading["rpm"] = random.randint(3500, 5000)
    elif anomaly_type == "battery_issue":
        reading["battery_voltage"] = round(random.uniform(10.5, 11.8), 1)
    elif anomaly_type == "low_tire_pressure":
        reading["pressure"] = round(random.uniform(18, 24), 1)
    elif anomaly_type == "low_fuel":
        reading["fuel_level"] = round(random.uniform(2, 8), 1)
    
    return reading

def generate_trip(vehicle: Dict, start_time: datetime, duration_minutes: int) -> List[Dict]:
    """Generate sensor readings for a single trip"""
    readings = []
    
    # Determine if this trip will have an anomaly (2.5% chance)
    has_anomaly = random.random() < 0.025
    anomaly_type = None
    anomaly_at_minute = None
    
    if has_anomaly:
        anomaly_types = ["overheating", "low_oil_pressure", "high_vibration", 
                        "battery_issue", "low_tire_pressure", "low_fuel"]
        anomaly_type = random.choice(anomaly_types)
        anomaly_at_minute = random.randint(duration_minutes // 2, duration_minutes - 1)
    
    # Generate readings every 1-2 minutes during trip
    current_time = start_time
    trip_minute = 0
    
    while trip_minute < duration_minutes:
        if has_anomaly and trip_minute == anomaly_at_minute:
            reading = generate_anomaly_reading(vehicle, current_time, anomaly_type)
        else:
            reading = generate_normal_reading(vehicle, current_time, trip_minute)
        
        readings.append(reading)
        
        # Next reading in 1-2 minutes
        interval = random.randint(1, 2)
        current_time += timedelta(minutes=interval)
        trip_minute += interval
    
    return readings

def generate_daily_trips(vehicle: Dict, date: datetime) -> List[Dict]:
    """Generate trips for a single day"""
    readings = []
    pattern = USAGE_PATTERNS[vehicle["usage_pattern"]]
    
    # Determine number of trips today (varies by day of week)
    is_weekend = date.weekday() >= 5
    
    if vehicle["usage_pattern"] == "commuter":
        num_trips = 2 if not is_weekend else random.randint(0, 2)
    elif vehicle["usage_pattern"] == "light":
        num_trips = random.randint(1, 2) if is_weekend else 0
    else:
        trips_per_day = pattern["trips_per_week"] / 7
        num_trips = int(trips_per_day) + (1 if random.random() < (trips_per_day % 1) else 0)
    
    # Generate trips at realistic times
    trip_times = []
    if num_trips > 0:
        if vehicle["usage_pattern"] == "commuter" and not is_weekend:
            # Morning and evening commute
            trip_times = [
                date.replace(hour=random.randint(7, 9), minute=random.randint(0, 59)),
                date.replace(hour=random.randint(17, 19), minute=random.randint(0, 59))
            ][:num_trips]
        else:
            # Random times during waking hours
            for _ in range(num_trips):
                hour = random.randint(8, 21)
                minute = random.randint(0, 59)
                trip_times.append(date.replace(hour=hour, minute=minute))
            trip_times.sort()
    
    # Generate readings for each trip
    for trip_time in trip_times:
        duration = pattern["avg_trip_duration"] + random.randint(-15, 15)
        duration = max(10, duration)  # At least 10 minutes
        trip_readings = generate_trip(vehicle, trip_time, duration)
        readings.extend(trip_readings)
    
    return readings

def generate_yearly_data() -> Dict:
    """Generate complete yearly dataset"""
    print("🚗 Generating 1 year of synthetic car sensor data...")
    print(f"📅 Date range: {START_DATE.date()} to {END_DATE.date()}")
    print(f"🚙 Vehicles: {len(VEHICLES)}")
    print()
    
    all_readings = []
    stats = {
        "total_readings": 0,
        "total_anomalies": 0,
        "readings_per_vehicle": {},
        "anomalies_per_type": {},
        "trips_per_vehicle": {}
    }
    
    # Generate data for each vehicle
    for vehicle in VEHICLES:
        print(f"Generating data for {vehicle['make']} {vehicle['model']} ({vehicle['id']})...")
        vehicle_readings = []
        vehicle_trips = 0
        
        current_date = START_DATE
        while current_date <= END_DATE:
            daily_readings = generate_daily_trips(vehicle, current_date)
            vehicle_readings.extend(daily_readings)
            
            # Count trips (group of consecutive readings)
            if daily_readings:
                vehicle_trips += 1
            
            current_date += timedelta(days=1)
        
        all_readings.extend(vehicle_readings)
        
        # Update stats
        stats["readings_per_vehicle"][vehicle["id"]] = len(vehicle_readings)
        stats["trips_per_vehicle"][vehicle["id"]] = vehicle_trips
        
        anomalies = [r for r in vehicle_readings if r["is_anomaly"]]
        for anomaly in anomalies:
            atype = anomaly["anomaly_type"]
            stats["anomalies_per_type"][atype] = stats["anomalies_per_type"].get(atype, 0) + 1
        
        print(f"  ✓ {len(vehicle_readings)} readings, {len(anomalies)} anomalies, {vehicle_trips} trips")
    
    # Sort all readings by timestamp
    all_readings.sort(key=lambda x: x["timestamp"])
    
    stats["total_readings"] = len(all_readings)
    stats["total_anomalies"] = sum(stats["anomalies_per_type"].values())
    stats["anomaly_rate"] = round(stats["total_anomalies"] / stats["total_readings"] * 100, 2)
    
    return {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "start_date": START_DATE.isoformat(),
            "end_date": END_DATE.isoformat(),
            "total_days": TOTAL_DAYS,
            "num_vehicles": len(VEHICLES),
            "num_users": len(USERS)
        },
        "vehicles": VEHICLES,
        "users": USERS,
        "readings": all_readings,
        "statistics": stats
    }

def main():
    print("=" * 60)
    print("  Car Health Monitor - Yearly Synthetic Data Generator")
    print("=" * 60)
    print()
    
    # Generate data
    data = generate_yearly_data()
    
    # Save to file
    output_file = "test-data/synthetic_data_yearly.json"
    print()
    print(f"💾 Saving data to {output_file}...")
    
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    # Print summary
    print()
    print("=" * 60)
    print("  GENERATION COMPLETE")
    print("=" * 60)
    print()
    print(f"📊 Total Readings: {data['statistics']['total_readings']:,}")
    print(f"⚠️  Total Anomalies: {data['statistics']['total_anomalies']:,} ({data['statistics']['anomaly_rate']}%)")
    print(f"📅 Date Range: {TOTAL_DAYS} days")
    print(f"🚙 Vehicles: {len(VEHICLES)}")
    print(f"👥 Users: {len(USERS)}")
    print()
    print("Readings per Vehicle:")
    for vid, count in data['statistics']['readings_per_vehicle'].items():
        trips = data['statistics']['trips_per_vehicle'][vid]
        print(f"  {vid}: {count:,} readings ({trips} trips)")
    print()
    print("Anomalies by Type:")
    for atype, count in sorted(data['statistics']['anomalies_per_type'].items()):
        pct = round(count / data['statistics']['total_anomalies'] * 100, 1)
        print(f"  {atype}: {count} ({pct}%)")
    print()
    print(f"✅ Data saved to: {output_file}")
    print()

if __name__ == "__main__":
    main()
