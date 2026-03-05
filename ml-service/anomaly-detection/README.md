# ML Anomaly Detection Service

FastAPI-based machine learning service for vehicle health anomaly detection.

## Features

- Isolation Forest algorithm for anomaly detection
- Real-time sensor data analysis
- Health score calculation
- Model training endpoint
- RESTful API

## Quick Start

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `POST /analyze` - Analyze sensor data
- `POST /train` - Train model
- `GET /model/info` - Model information

## Docker

```bash
docker build -t ml-anomaly-detection .
docker run -p 8000:8000 ml-anomaly-detection
```

## Example Request

```json
{
  "data": [
    {
      "vehicle_id": "123",
      "timestamp": "2024-01-01T00:00:00Z",
      "temperature": 85.5,
      "pressure": 32.0,
      "vibration": 0.5,
      "rpm": 2500
    }
  ]
}
```
