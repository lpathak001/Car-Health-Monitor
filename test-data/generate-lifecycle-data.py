#!/usr/bin/env python3
"""
Generate 25-year car lifecycle data
Shows realistic vehicle aging, maintenance, and degradation
"""

import json
import random
from datetime import datetime, timedelta
from typing import List, Dict
import math

# Configuration
START_DATE = datetime(2001, 1, 1)  # 25 years ago
END_DATE = datetime(2026, 3, 5)    # Today
TOTAL_YEARS = 25

# Single vehicle for lifecycle tracking
VEHICLE = {
    "id": "VEH-LIFECYCLE-001",
    "make": "Toyota",
    "model": "Camry",
    "year": 2001,
    "vin": "4T1BF28B81U123456",
    "purchase_date": "2001-01-01",
    "initial_mileage": 0,
    "owner": "user-lifecycle-001"
}

USER = {
    "id": "user-lifecycle-001",
    "email": "james.wilson@example.com",
    "name": "James Wilson"
}

# Maintenance events over 25 years
MAINTENANCE_SCHEDULE = {
    "oil_change": {"interval_miles": 5000, "cost": 50, "improves_health": 2},
    "tire_rotation": {"interval_miles": 7500, "cost": 40, "improves_health": 1},
    "brake_pads": {"interval_miles": 50000, "cost": 300, "improves_health": 5},
    "battery_replacement": {"interval_years": 4, "cost": 150, "improves_health": 3},
    "transmission_service": {"interval_miles": 60000, "cost": 200, "improves_health": 4},
    "timing_belt": {"interval_miles": 100000, "cost": 800, "improves_health": 10},
    "spark_plugs": {"interval_miles": 30000, "cost": 150, "improves_health": 3},
    "air_filter": {"interval_miles": 15000, "cost": 30, "improves_health": 1},
    "coolant_flush": {"interval_miles": 50000, "cost": 100, "improves_health": 2},
    "major_service": {"interval_miles": 100000, "cost": 1500, "improves_health": 15}
}

def calculate_age_factor(years: float) -> float:
    """Calculate degradation factor based on vehicle age"""
    # Exponential degradation: newer cars degrade slower
    return 1 + (years / 25) * 2  # 1.0 to 3.0 over 25 years

def calculate_mileage_factor(mileage: int) -> float:
    """Calculate degradation factor based on mileage"""
    # High mileage increases wear
    if mileage < 50000:
        return 1.0
    elif mileage < 100000:
        return 1.2
    elif mileage < 150000:
        return 1.5
    elif mileage < 200000:
        return 2.0
    else:
        return 2.5

def get_season(date: datetime) -> str:
    """Determine season"""
    month = date.month
    if month in [12, 1, 2]:
        return "winter"
    elif month in [3, 4, 5]:
        return "spring"
    elif month in [6, 7, 8]:
        return "summer"
    else:
        return "fall"

def get_temperature_base(season: str, hour: int, year: int) -> float:
    """Get base temperature with aging effect"""
    season_temps = {
        "winter": 35,
        "spring": 60,
        "summer": 85,
        "fall": 55
    }
    base = season_temps[season]
    
    # Daily variation
    if 6 <= hour <= 18:
        base += 15 * math.sin((hour - 6) * math.pi / 12)
    else:
        base -= 10
    
    # Aging effect: older engines run hotter
    age_increase = (year / 25) * 10  # Up to 10°F hotter after 25 years
    
    return base + age_increase

def generate_normal_reading(
    vehicle: Dict,
    timestamp: datetime,
    trip_minutes: int,
    current_mileage: int,
    years_old: float,
    health_score: float
) -> Dict:
    """Generate sensor reading with aging effects"""
    season = get_season(timestamp)
    hour = timestamp.hour
    
    # Base values with aging
    age_factor = calculate_age_factor(years_old)
    mileage_factor = calculate_mileage_factor(current_mileage)
    degradation = age_factor * mileage_factor
    
    # Temperature increases with age and poor health
    temp_base = get_temperature_base(season, hour, int(years_old))
    temp_variation = min(trip_minutes * 0.5, 30)
    temp_aging = (100 - health_score) * 0.3  # Poor health = higher temp
    
    # Oil pressure decreases with age
    oil_base = 45 - (years_old * 0.8)  # Decreases over time
    oil_base = max(oil_base, 25)  # Minimum 25 PSI
    
    # Battery voltage decreases with age
    battery_base = 13.8 - (years_old * 0.04)  # Decreases over time
    battery_base = max(battery_base, 12.0)  # Minimum 12V
    
    # Vibration increases with age
    vibration_base = 0.3 + (years_old * 0.02)  # Increases over time
    vibration_base = min(vibration_base, 1.5)  # Maximum 1.5 G
    
    reading = {
        "vehicle_id": vehicle["id"],
        "user_id": vehicle["owner"],
        "timestamp": timestamp.isoformat(),
        "mileage": current_mileage,
        "vehicle_age_years": round(years_old, 2),
        "health_score": round(health_score, 1),
        "temperature": round(temp_base + temp_variation + temp_aging + random.uniform(-5, 5), 1),
        "pressure": round(random.uniform(28, 35) - (years_old * 0.1), 1),
        "vibration": round(vibration_base + random.uniform(-0.1, 0.2), 2),
        "rpm": random.randint(1500, 3500),
        "speed": random.randint(0, 75),
        "fuel_level": round(random.uniform(20, 95), 1),
        "battery_voltage": round(battery_base + random.uniform(-0.2, 0.2), 1),
        "oil_pressure": round(oil_base + random.uniform(-5, 5), 1),
        "is_anomaly": False,
        "anomaly_type": None
    }
    
    return reading

def should_have_anomaly(years_old: float, health_score: float, mileage: int) -> tuple:
    """Determine if reading should be anomalous based on age and health"""
    # Base anomaly rate increases with age and poor health
    base_rate = 0.01  # 1%
    age_multiplier = 1 + (years_old / 25) * 4  # Up to 5x at 25 years
    health_multiplier = 1 + ((100 - health_score) / 100) * 2  # Up to 3x at 0 health
    mileage_multiplier = 1 + (mileage / 300000) * 2  # Up to 3x at 300k miles
    
    anomaly_rate = base_rate * age_multiplier * health_multiplier * mileage_multiplier
    anomaly_rate = min(anomaly_rate, 0.15)  # Cap at 15%
    
    if random.random() < anomaly_rate:
        # Choose anomaly type based on age
        if years_old < 5:
            types = ["low_tire_pressure", "low_fuel"]
        elif years_old < 10:
            types = ["low_tire_pressure", "low_fuel", "battery_issue", "high_vibration"]
        elif years_old < 15:
            types = ["battery_issue", "high_vibration", "low_oil_pressure", "overheating"]
        else:
            types = ["overheating", "low_oil_pressure", "high_vibration", "battery_issue"]
        
        return True, random.choice(types)
    
    return False, None

def generate_anomaly_reading(
    vehicle: Dict,
    timestamp: datetime,
    anomaly_type: str,
    current_mileage: int,
    years_old: float,
    health_score: float
) -> Dict:
    """Generate anomalous reading"""
    reading = generate_normal_reading(vehicle, timestamp, 30, current_mileage, years_old, health_score)
    reading["is_anomaly"] = True
    reading["anomaly_type"] = anomaly_type
    
    if anomaly_type == "overheating":
        reading["temperature"] = round(random.uniform(150, 200), 1)
        reading["rpm"] = random.randint(4000, 6000)
    elif anomaly_type == "low_oil_pressure":
        reading["oil_pressure"] = round(random.uniform(5, 14), 1)
        reading["temperature"] = round(random.uniform(120, 150), 1)
    elif anomaly_type == "high_vibration":
        reading["vibration"] = round(random.uniform(2.0, 5.0), 2)
        reading["rpm"] = random.randint(3500, 5500)
    elif anomaly_type == "battery_issue":
        reading["battery_voltage"] = round(random.uniform(10.0, 11.8), 1)
    elif anomaly_type == "low_tire_pressure":
        reading["pressure"] = round(random.uniform(15, 24), 1)
    elif anomaly_type == "low_fuel":
        reading["fuel_level"] = round(random.uniform(1, 7), 1)
    
    return reading

def generate_trip(
    vehicle: Dict,
    start_time: datetime,
    duration_minutes: int,
    current_mileage: int,
    years_old: float,
    health_score: float
) -> tuple:
    """Generate readings for a trip"""
    readings = []
    miles_driven = 0
    
    # Check for anomaly
    has_anomaly, anomaly_type = should_have_anomaly(years_old, health_score, current_mileage)
    anomaly_at_minute = None
    
    if has_anomaly:
        anomaly_at_minute = random.randint(duration_minutes // 2, duration_minutes - 1)
    
    current_time = start_time
    trip_minute = 0
    
    while trip_minute < duration_minutes:
        if has_anomaly and trip_minute == anomaly_at_minute:
            reading = generate_anomaly_reading(
                vehicle, current_time, anomaly_type,
                current_mileage + miles_driven, years_old, health_score
            )
        else:
            reading = generate_normal_reading(
                vehicle, current_time, trip_minute,
                current_mileage + miles_driven, years_old, health_score
            )
        
        readings.append(reading)
        
        # Increment mileage (assume average 30 mph)
        miles_driven += 0.5
        
        interval = random.randint(1, 2)
        current_time += timedelta(minutes=interval)
        trip_minute += interval
    
    return readings, miles_driven

def apply_maintenance(health_score: float, maintenance_type: str) -> float:
    """Apply maintenance and improve health score"""
    improvement = MAINTENANCE_SCHEDULE[maintenance_type]["improves_health"]
    new_score = min(health_score + improvement, 100)
    return new_score

def generate_lifecycle_data() -> Dict:
    """Generate 25-year lifecycle data"""
    print("=" * 70)
    print("  Car Health Monitor - 25-Year Lifecycle Data Generator")
    print("=" * 70)
    print()
    print(f"🚗 Generating 25 years of vehicle lifecycle data...")
    print(f"📅 Date range: {START_DATE.date()} to {END_DATE.date()}")
    print(f"🚙 Vehicle: {VEHICLE['make']} {VEHICLE['model']} {VEHICLE['year']}")
    print()
    
    all_readings = []
    maintenance_events = []
    current_mileage = 0
    health_score = 100.0  # Start perfect
    
    # Track maintenance intervals
    last_maintenance = {key: 0 for key in MAINTENANCE_SCHEDULE.keys()}
    last_battery_year = 0
    
    stats = {
        "total_readings": 0,
        "total_anomalies": 0,
        "total_trips": 0,
        "total_miles": 0,
        "maintenance_events": 0,
        "anomalies_by_type": {},
        "anomalies_by_year": {}
    }
    
    current_date = START_DATE
    year_count = 0
    
    while current_date <= END_DATE:
        years_old = (current_date - START_DATE).days / 365.25
        year_count = int(years_old)
        
        # Determine trips per week (decreases slightly with age as car becomes less reliable)
        base_trips_per_week = 10
        age_reduction = min(years_old * 0.1, 3)  # Max 3 fewer trips
        trips_per_week = max(base_trips_per_week - age_reduction, 5)
        
        # Weekend check
        is_weekend = current_date.weekday() >= 5
        num_trips = 2 if not is_weekend else random.randint(0, 2)
        
        # Adjust for age
        if random.random() > (trips_per_week / 10):
            num_trips = 0
        
        # Generate trips
        for _ in range(num_trips):
            hour = random.randint(7, 20)
            minute = random.randint(0, 59)
            trip_time = current_date.replace(hour=hour, minute=minute)
            
            duration = random.randint(20, 60)
            trip_readings, miles = generate_trip(
                VEHICLE, trip_time, duration,
                current_mileage, years_old, health_score
            )
            
            all_readings.extend(trip_readings)
            current_mileage += int(miles)
            stats["total_trips"] += 1
            
            # Count anomalies
            for reading in trip_readings:
                if reading["is_anomaly"]:
                    stats["total_anomalies"] += 1
                    atype = reading["anomaly_type"]
                    stats["anomalies_by_type"][atype] = stats["anomalies_by_type"].get(atype, 0) + 1
                    stats["anomalies_by_year"][year_count] = stats["anomalies_by_year"].get(year_count, 0) + 1
        
        # Check for maintenance needs
        for maint_type, schedule in MAINTENANCE_SCHEDULE.items():
            if "interval_miles" in schedule:
                if current_mileage - last_maintenance[maint_type] >= schedule["interval_miles"]:
                    # Perform maintenance
                    maintenance_events.append({
                        "date": current_date.isoformat(),
                        "type": maint_type,
                        "mileage": current_mileage,
                        "cost": schedule["cost"],
                        "health_before": round(health_score, 1),
                        "health_after": round(apply_maintenance(health_score, maint_type), 1)
                    })
                    health_score = apply_maintenance(health_score, maint_type)
                    last_maintenance[maint_type] = current_mileage
                    stats["maintenance_events"] += 1
            
            elif "interval_years" in schedule:
                if years_old - last_battery_year >= schedule["interval_years"]:
                    maintenance_events.append({
                        "date": current_date.isoformat(),
                        "type": maint_type,
                        "mileage": current_mileage,
                        "cost": schedule["cost"],
                        "health_before": round(health_score, 1),
                        "health_after": round(apply_maintenance(health_score, maint_type), 1)
                    })
                    health_score = apply_maintenance(health_score, maint_type)
                    last_battery_year = int(years_old)
                    stats["maintenance_events"] += 1
        
        # Natural degradation (health decreases over time)
        daily_degradation = 0.01  # 0.01% per day
        age_multiplier = 1 + (years_old / 25)  # Degrades faster as it ages
        health_score = max(health_score - (daily_degradation * age_multiplier), 30)  # Min 30%
        
        # Progress indicator
        if current_date.day == 1 and current_date.month == 1:
            print(f"Year {year_count + 1}/25: {current_mileage:,} miles, Health: {health_score:.1f}%, Trips: {stats['total_trips']}")
        
        current_date += timedelta(days=1)
    
    stats["total_readings"] = len(all_readings)
    stats["total_miles"] = current_mileage
    stats["final_health_score"] = round(health_score, 1)
    stats["anomaly_rate"] = round(stats["total_anomalies"] / stats["total_readings"] * 100, 2) if stats["total_readings"] > 0 else 0
    
    return {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "start_date": START_DATE.isoformat(),
            "end_date": END_DATE.isoformat(),
            "total_years": TOTAL_YEARS,
            "vehicle": VEHICLE,
            "user": USER
        },
        "readings": all_readings,
        "maintenance_events": maintenance_events,
        "statistics": stats
    }

def main():
    print()
    
    # Generate data
    data = generate_lifecycle_data()
    
    # Save to file
    output_file = "test-data/synthetic_data_lifecycle_25years.json"
    print()
    print(f"💾 Saving data to {output_file}...")
    
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    # Print summary
    print()
    print("=" * 70)
    print("  GENERATION COMPLETE")
    print("=" * 70)
    print()
    print(f"📊 Total Readings: {data['statistics']['total_readings']:,}")
    print(f"🚗 Total Miles: {data['statistics']['total_miles']:,}")
    print(f"🛣️  Total Trips: {data['statistics']['total_trips']:,}")
    print(f"⚠️  Total Anomalies: {data['statistics']['total_anomalies']:,} ({data['statistics']['anomaly_rate']}%)")
    print(f"🔧 Maintenance Events: {data['statistics']['maintenance_events']}")
    print(f"💚 Final Health Score: {data['statistics']['final_health_score']}%")
    print()
    print("Anomalies by Type:")
    for atype, count in sorted(data['statistics']['anomalies_by_type'].items(), key=lambda x: x[1], reverse=True):
        print(f"  {atype}: {count}")
    print()
    print(f"✅ Data saved to: {output_file}")
    print()

if __name__ == "__main__":
    main()
