# System Architecture

## Overview

The Car Health Monitoring system consists of four main components working together to provide real-time vehicle health insights.

## Components

### 1. Mobile Application
- **Technology**: React Native
- **Responsibilities**:
  - Collect sensor data via OBD-II adapter (Bluetooth/WiFi)
  - Display health dashboard
  - Send data to backend API
  - Show alerts and notifications
  - Visualize historical trends

### 2. Backend API
- **Technology**: Node.js/Express
- **Responsibilities**:
  - User authentication and authorization
  - Vehicle management
  - Sensor data ingestion
  - Data validation and preprocessing
  - Communication with ML service
  - Historical data queries

### 3. ML Anomaly Detection Service
- **Technology**: Python/FastAPI
- **Responsibilities**:
  - Train anomaly detection models
  - Real-time anomaly scoring
  - Pattern recognition
  - Predictive maintenance algorithms
  - Model versioning and updates

### 4. Data Storage
- **PostgreSQL**: User data, vehicles, alerts
- **TimescaleDB**: Time-series sensor data
- **Redis**: Caching and real-time data

## Data Flow

1. Mobile app collects sensor data from vehicle
2. Data sent to Backend API via REST/WebSocket
3. Backend validates and stores data
4. ML Service analyzes data for anomalies
5. Results stored and pushed to mobile app
6. User receives health updates and alerts

## Sensor Data Types

- Engine metrics (RPM, temperature, load)
- Fuel system (consumption, pressure)
- Transmission (gear, temperature)
- Brakes (pressure, wear indicators)
- Battery (voltage, current)
- Emissions (O2 sensors, catalytic converter)
- Tire pressure (TPMS)
- Diagnostic trouble codes (DTCs)

## Anomaly Detection Approach

- **Isolation Forest**: For multivariate anomaly detection
- **LSTM Autoencoders**: For time-series pattern recognition
- **Statistical Methods**: Z-score, moving averages
- **Rule-based**: Threshold violations, DTC analysis

## Security

- JWT authentication
- API rate limiting
- Data encryption in transit (TLS)
- Data encryption at rest
- GDPR compliance for user data
