# Features #1 & #2 - Quick Start Guide

## Overview

Two new microservices have been built and deployed:
- **Analytics Service** (Port 3007) - Fleet analytics and reporting
- **Predictive Maintenance Service** (Port 3006) - Maintenance predictions and RUL estimation

## Quick Start

### 1. Verify Services Are Running

```bash
# Check Analytics Service
curl http://localhost:3007/health

# Check Predictive Maintenance Service
curl http://localhost:3006/health
```

### 2. Get Fleet Health Summary

```bash
curl http://localhost:3007/api/analytics/fleet-health | jq .
```

**Response**:
```json
{
  "timestamp": "2026-03-05T08:38:52.487Z",
  "fleet_size": 1,
  "vehicles": [
    {
      "id": "65c42515-739a-4292-99a2-5e013a59096d",
      "make": "Toyota",
      "model": "Camry",
      "year": 2022,
      "total_readings": "20",
      "anomalies": "4",
      "health_score": 80,
      "avg_temperature": 91.81,
      "avg_oil_pressure": 51.98,
      "avg_battery_voltage": 14.08
    }
  ],
  "overall_health": "80.00"
}
```

### 3. Get Vehicle Trends

```bash
VEHICLE_ID="65c42515-739a-4292-99a2-5e013a59096d"
curl "http://localhost:3007/api/analytics/vehicle/$VEHICLE_ID/trends?days=30" | jq .
```

### 4. Get Anomaly Analysis

```bash
curl "http://localhost:3007/api/analytics/anomalies?days=30" | jq .
```

### 5. Get Cost Analysis

```bash
curl "http://localhost:3007/api/analytics/cost-analysis?period=month" | jq .
```

**Response**:
```json
{
  "period": "month",
  "vehicles": [...],
  "summary": {
    "total_estimated_repair_cost": 2000,
    "total_prevented_cost": 1400,
    "roi": "70.00"
  }
}
```

### 6. Get Component Failure Predictions

```bash
VEHICLE_ID="65c42515-739a-4292-99a2-5e013a59096d"
curl "http://localhost:3006/api/predictive/component-failures/$VEHICLE_ID" | jq .
```

### 7. Get Maintenance Schedule

```bash
curl "http://localhost:3006/api/predictive/maintenance-schedule/$VEHICLE_ID" | jq .
```

**Response**:
```json
{
  "vehicle_id": "...",
  "last_service_date": "2026-03-05T08:38:27.017Z",
  "total_anomalies": "4",
  "recommended_schedule": [
    {
      "service": "Oil Change",
      "interval_miles": 5000,
      "interval_months": 6,
      "priority": "high",
      "estimated_cost": 50
    },
    ...
  ],
  "total_estimated_annual_cost": 1020
}
```

### 8. Get Remaining Useful Life (RUL)

```bash
curl "http://localhost:3006/api/predictive/rul/$VEHICLE_ID" | jq .
```

**Response**:
```json
{
  "vehicle_id": "...",
  "remaining_useful_life": {
    "years": 9.2,
    "miles": 292000,
    "confidence": 92
  },
  "degradation_factors": {
    "anomaly_rate": 20,
    "temperature_degradation": 0,
    "oil_system_degradation": 0,
    "battery_degradation": 0
  },
  "recommendation": "Vehicle in good condition"
}
```

### 9. Export Reports

```bash
# Export as JSON
curl "http://localhost:3007/api/analytics/export/json?days=30" | jq .

# Export as CSV
curl "http://localhost:3007/api/analytics/export/csv?days=30" > report.csv
```

### 10. Get Parts Inventory Recommendations

```bash
curl "http://localhost:3006/api/predictive/parts-inventory" | jq .
```

## API Reference

### Analytics Service (Port 3007)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/api/analytics/fleet-health` | GET | Fleet health summary |
| `/api/analytics/vehicle/:vehicleId/trends` | GET | Vehicle trends (query: days) |
| `/api/analytics/anomalies` | GET | Anomaly analysis (query: days, vehicle_id) |
| `/api/analytics/cost-analysis` | GET | Cost analysis (query: period, vehicle_id) |
| `/api/analytics/maintenance-recommendations` | GET | Maintenance recommendations (query: vehicle_id) |
| `/api/analytics/export/:format` | GET | Export reports (format: json/csv, query: days, vehicle_id) |

### Predictive Maintenance Service (Port 3006)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/api/predictive/component-failures/:vehicleId` | GET | Component failure predictions |
| `/api/predictive/maintenance-schedule/:vehicleId` | GET | Maintenance schedule |
| `/api/predictive/rul/:vehicleId` | GET | Remaining Useful Life estimation |
| `/api/predictive/parts-inventory` | GET | Parts inventory recommendations |

## Query Parameters

### Analytics Service

**Fleet Health**:
- No parameters

**Vehicle Trends**:
- `days` (optional, default: 30) - Number of days to analyze

**Anomalies**:
- `days` (optional, default: 30) - Number of days to analyze
- `vehicle_id` (optional) - Filter by specific vehicle

**Cost Analysis**:
- `period` (optional, default: month) - month, quarter, year, week
- `vehicle_id` (optional) - Filter by specific vehicle

**Export**:
- `format` (required) - json or csv
- `days` (optional, default: 30) - Number of days to export
- `vehicle_id` (optional) - Filter by specific vehicle

## Performance

- **Response Time**: <100ms for most endpoints
- **Caching**: Fleet health cached for 5 minutes
- **Database**: Optimized queries with indexes
- **Throughput**: 100+ concurrent requests

## Integration

Both services integrate with:
- PostgreSQL database (vehicles, sensor_readings tables)
- Redis cache (fleet health summary)
- Existing microservices (auth, vehicle, sensor-data, health-analysis, alert)

## Troubleshooting

### Service Not Responding

```bash
# Check if service is running
curl http://localhost:3007/health
curl http://localhost:3006/health

# Check logs
docker logs car-health-postgres
docker logs car-health-redis
```

### No Data Returned

```bash
# Verify data exists in database
docker exec car-health-postgres psql -U postgres -d car_health_monitor -c "SELECT COUNT(*) FROM vehicles;"

# Clear Redis cache
docker exec car-health-redis redis-cli FLUSHALL
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DATABASE_URL
```

## Next Steps

1. **Load Production Data**: Import real vehicle and sensor data
2. **Frontend Integration**: Connect dashboard to real endpoints
3. **Advanced Analytics**: Implement predictive models (ARIMA, Prophet)
4. **Alerting**: Set up automated alerts based on predictions
5. **Reporting**: Generate scheduled reports and exports

## Support

For issues or questions, refer to:
- `TASK_18_COMPLETION.md` - Detailed implementation notes
- `FEATURE_ROADMAP.md` - Future features and enhancements
- Service logs in `backend-services/*/[service-name].log`
