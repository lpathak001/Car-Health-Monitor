#!/usr/bin/env python3
"""
Split 25-year lifecycle data into 5 stages
Each stage represents a distinct vehicle life phase
"""

import json
from datetime import datetime

def split_lifecycle_data():
    """Split lifecycle data into 5 stages"""
    
    print("=" * 70)
    print("  Splitting 25-Year Lifecycle Data into 5 Stages")
    print("=" * 70)
    print()
    
    # Load full lifecycle data
    print("📖 Loading full lifecycle data...")
    with open('test-data/synthetic_data_lifecycle_25years.json', 'r') as f:
        full_data = json.load(f)
    
    readings = full_data['readings']
    maintenance = full_data['maintenance_events']
    
    print(f"✓ Loaded {len(readings):,} readings and {len(maintenance)} maintenance events")
    print()
    
    # Define 5 stages
    stages = {
        1: {
            "name": "New Car",
            "years": "0-5",
            "description": "Fresh from dealer, excellent condition",
            "health_range": "99-100%",
            "anomaly_rate": "0.01%"
        },
        2: {
            "name": "Mature",
            "years": "6-10",
            "description": "Still reliable, some wear visible",
            "health_range": "97-99%",
            "anomaly_rate": "0.05%"
        },
        3: {
            "name": "Middle Age",
            "years": "11-15",
            "description": "More repairs needed, aging evident",
            "health_range": "95-97%",
            "anomaly_rate": "0.10%"
        },
        4: {
            "name": "Senior",
            "years": "16-20",
            "description": "Noticeable degradation, higher costs",
            "health_range": "90-95%",
            "anomaly_rate": "0.18%"
        },
        5: {
            "name": "Veteran",
            "years": "21-25",
            "description": "Runs but needs constant care",
            "health_range": "88-94%",
            "anomaly_rate": "0.22%"
        }
    }
    
    # Split data by stage
    stage_data = {}
    
    for stage_num, stage_info in stages.items():
        print(f"Processing Stage {stage_num}: {stage_info['name']} ({stage_info['years']} years)...")
        
        # Calculate year boundaries
        start_year = (stage_num - 1) * 5
        end_year = stage_num * 5
        
        # Filter readings for this stage
        stage_readings = [
            r for r in readings 
            if start_year <= r['vehicle_age_years'] < end_year
        ]
        
        # Filter maintenance for this stage
        stage_maintenance = [
            m for m in maintenance
            if start_year <= (datetime.fromisoformat(m['date']).year - 2001) < end_year
        ]
        
        # Calculate statistics
        anomalies = [r for r in stage_readings if r['is_anomaly']]
        anomaly_types = {}
        for a in anomalies:
            atype = a['anomaly_type']
            anomaly_types[atype] = anomaly_types.get(atype, 0) + 1
        
        mileage_start = stage_readings[0]['mileage'] if stage_readings else 0
        mileage_end = stage_readings[-1]['mileage'] if stage_readings else 0
        health_start = stage_readings[0]['health_score'] if stage_readings else 100
        health_end = stage_readings[-1]['health_score'] if stage_readings else 100
        
        # Create stage data
        stage_data[stage_num] = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "stage": stage_num,
                "stage_name": stage_info['name'],
                "stage_description": stage_info['description'],
                "years": stage_info['years'],
                "health_range": stage_info['health_range'],
                "anomaly_rate": stage_info['anomaly_rate'],
                "vehicle": full_data['metadata']['vehicle'],
                "user": full_data['metadata']['user']
            },
            "readings": stage_readings,
            "maintenance_events": stage_maintenance,
            "statistics": {
                "total_readings": len(stage_readings),
                "total_anomalies": len(anomalies),
                "anomaly_rate": round(len(anomalies) / len(stage_readings) * 100, 2) if stage_readings else 0,
                "anomalies_by_type": anomaly_types,
                "mileage_start": mileage_start,
                "mileage_end": mileage_end,
                "mileage_driven": mileage_end - mileage_start,
                "health_start": round(health_start, 1),
                "health_end": round(health_end, 1),
                "health_change": round(health_end - health_start, 1),
                "maintenance_events": len(stage_maintenance),
                "maintenance_cost": sum(m['cost'] for m in stage_maintenance)
            }
        }
        
        # Print stage summary
        print(f"  ✓ {len(stage_readings):,} readings")
        print(f"  ✓ {len(anomalies)} anomalies ({stage_data[stage_num]['statistics']['anomaly_rate']}%)")
        print(f"  ✓ {mileage_end - mileage_start:,} miles driven")
        print(f"  ✓ {len(stage_maintenance)} maintenance events (${sum(m['cost'] for m in stage_maintenance):,})")
        print(f"  ✓ Health: {health_start:.1f}% → {health_end:.1f}%")
        print()
    
    # Save each stage
    print("=" * 70)
    print("  Saving Stage Datasets")
    print("=" * 70)
    print()
    
    for stage_num, data in stage_data.items():
        stage_name = stages[stage_num]['name'].lower().replace(' ', '_')
        filename = f"test-data/lifecycle_stage_{stage_num}_{stage_name}.json"
        
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        file_size = os.path.getsize(filename) / (1024 * 1024)  # MB
        print(f"Stage {stage_num}: {filename}")
        print(f"  • Size: {file_size:.1f} MB")
        print(f"  • Readings: {len(data['readings']):,}")
        print(f"  • Maintenance: {data['statistics']['maintenance_events']}")
        print()
    
    # Create summary file
    print("Creating summary file...")
    summary = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "total_stages": 5,
            "total_years": 25,
            "vehicle": full_data['metadata']['vehicle'],
            "user": full_data['metadata']['user']
        },
        "stages": {}
    }
    
    for stage_num, data in stage_data.items():
        stage_name = stages[stage_num]['name'].lower().replace(' ', '_')
        summary["stages"][stage_num] = {
            "name": stages[stage_num]['name'],
            "description": stages[stage_num]['description'],
            "years": stages[stage_num]['years'],
            "file": f"lifecycle_stage_{stage_num}_{stage_name}.json",
            "statistics": data['statistics']
        }
    
    with open('test-data/lifecycle_stages_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("✓ Summary file created: test-data/lifecycle_stages_summary.json")
    print()
    
    # Print final summary
    print("=" * 70)
    print("  SPLIT COMPLETE")
    print("=" * 70)
    print()
    print("Files created:")
    for stage_num in range(1, 6):
        stage_name = stages[stage_num]['name'].lower().replace(' ', '_')
        print(f"  • lifecycle_stage_{stage_num}_{stage_name}.json")
    print(f"  • lifecycle_stages_summary.json")
    print()
    print("Total stages: 5")
    print("Total readings: {:,}".format(sum(len(data['readings']) for data in stage_data.values())))
    print("Total maintenance events: {}".format(sum(data['statistics']['maintenance_events'] for data in stage_data.values())))
    print()

if __name__ == "__main__":
    import os
    split_lifecycle_data()
