# API Specification

## Base URL
```
Production: https://api.carhealthmonitor.com/v1
Development: http://localhost:3000/v1
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register new user
```json
Request:
{
  "email": "user@example.com",
  "password": "securepass123",
  "name": "John Doe"
}

Response: 201
{
  "user": { "id": "uuid", "email": "...", "name": "..." },
  "token": "jwt_token"
}
```

#### POST /auth/login
User login
```json
Request:
{
  "email": "user@example.com",
  "password": "securepass123"
}

Response: 200
{
  "user": { "id": "uuid", "email": "...", "name": "..." },
  "token": "jwt_token"
}
```

### Vehicles

#### GET /vehicles
List user's vehicles

#### POST /vehicles
Add new vehicle
```json
Request:
{
  "vin": "1HGBH41JXMN109186",
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "nickname": "My Car"
}
```

#### GET /vehicles/:id
Get vehicle details

### Sensor Data

#### POST /sensor-data
Submit sensor readings
```json
Request:
{
  "vehicleId": "uuid",
  "timestamp": "2026-03-04T10:30:00Z",
  "readings": {
    "engineRPM": 2500,
    "engineTemp": 195,
    "speed": 65,
    "fuelLevel": 75,
    "batteryVoltage": 14.2,
    "engineLoad": 45,
    "throttlePosition": 30
  }
}
```

#### GET /sensor-data/:vehicleId
Get historical sensor data
Query params: `startDate`, `endDate`, `metrics`

### Health & Anomalies

#### GET /health/:vehicleId
Get current vehicle health score
```json
Response:
{
  "vehicleId": "uuid",
  "healthScore": 85,
  "lastUpdated": "2026-03-04T10:30:00Z",
  "subsystems": {
    "engine": { "score": 90, "status": "good" },
    "transmission": { "score": 85, "status": "good" },
    "brakes": { "score": 75, "status": "warning" },
    "battery": { "score": 95, "status": "good" }
  }
}
```

#### GET /anomalies/:vehicleId
Get detected anomalies
```json
Response:
{
  "anomalies": [
    {
      "id": "uuid",
      "timestamp": "2026-03-04T10:25:00Z",
      "severity": "medium",
      "subsystem": "brakes",
      "description": "Unusual brake pressure pattern detected",
      "recommendation": "Schedule brake inspection"
    }
  ]
}
```

### Alerts

#### GET /alerts
Get user alerts

#### PUT /alerts/:id/acknowledge
Mark alert as read
