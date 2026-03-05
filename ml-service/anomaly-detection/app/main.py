from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

app = FastAPI(title="ML Anomaly Detection Service", version="1.0.0")

# Models cache
models = {}

class SensorData(BaseModel):
    vehicle_id: str
    timestamp: str
    temperature: float
    pressure: float
    vibration: float
    rpm: float

class AnalysisRequest(BaseModel):
    data: List[SensorData]

class HealthScore(BaseModel):
    vehicle_id: str
    score: float
    status: str
    anomalies: List[str]

# Initialize model
def get_model():
    if 'isolation_forest' not in models:
        model = IsolationForest(contamination=0.1, random_state=42)
        # Pre-train with dummy data
        dummy_data = np.random.randn(100, 4) * 10 + [85, 32, 0.5, 2500]
        model.fit(dummy_data)
        models['isolation_forest'] = model
    return models['isolation_forest']

@app.get("/")
def root():
    return {"service": "ML Anomaly Detection", "version": "1.0.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "ml-anomaly-detection", "model_loaded": len(models) > 0}

@app.post("/analyze", response_model=HealthScore)
def analyze_sensor_data(request: AnalysisRequest):
    if not request.data:
        raise HTTPException(status_code=400, detail="No data provided")
    
    # Extract features
    features = np.array([[d.temperature, d.pressure, d.vibration, d.rpm] for d in request.data])
    
    # Get model
    model = get_model()
    
    predictions = model.predict(features)
    anomaly_count = np.sum(predictions == -1)
    
    # Calculate health score
    health_score = max(0, 100 - (anomaly_count / len(features) * 100))
    
    # Determine status
    if health_score >= 80:
        status = "good"
    elif health_score >= 60:
        status = "warning"
    else:
        status = "critical"
    
    # Identify anomalies
    anomalies = []
    for i, pred in enumerate(predictions):
        if pred == -1:
            anomalies.append(f"Anomaly at index {i}: temp={request.data[i].temperature}, rpm={request.data[i].rpm}")
    
    return HealthScore(
        vehicle_id=request.data[0].vehicle_id,
        score=round(health_score, 2),
        status=status,
        anomalies=anomalies[:5]  # Return top 5
    )

@app.post("/train")
def train_model(request: AnalysisRequest):
    features = np.array([[d.temperature, d.pressure, d.vibration, d.rpm] for d in request.data])
    model = get_model()
    model.fit(features)
    return {"message": "Model trained successfully", "samples": len(features)}

@app.get("/model/info")
def model_info():
    return {
        "algorithm": "Isolation Forest",
        "contamination": 0.1,
        "features": ["temperature", "pressure", "vibration", "rpm"],
        "trained": 'isolation_forest' in models
    }
