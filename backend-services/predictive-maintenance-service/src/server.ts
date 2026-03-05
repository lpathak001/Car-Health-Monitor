import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import { createClient } from 'redis';
import winston from 'winston';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3006;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'predictive-maintenance.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/car_health_monitor'
});

// Redis connection
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.connect().catch(err => logger.error('Redis connection error:', err));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'predictive-maintenance-service',
    timestamp: new Date().toISOString()
  });
});

// Predictive model for component failure
interface ComponentHealth {
  component: string;
  health_score: number;
  failure_probability: number;
  days_until_failure: number;
  recommended_action: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

function predictComponentFailure(anomalyCount: number, avgValue: number, normalRange: [number, number]): ComponentHealth {
  const [min, max] = normalRange;
  const deviation = Math.abs(avgValue - (min + max) / 2) / ((max - min) / 2);
  
  // Calculate failure probability (0-100%)
  const failureProbability = Math.min(100, (anomalyCount * 10) + (deviation * 30));
  
  // Estimate days until failure
  const daysUntilFailure = Math.max(1, Math.round(365 * (1 - failureProbability / 100)));
  
  // Determine urgency
  let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
  if (failureProbability > 80) urgency = 'critical';
  else if (failureProbability > 60) urgency = 'high';
  else if (failureProbability > 40) urgency = 'medium';
  
  return {
    component: '',
    health_score: Math.round(100 - failureProbability),
    failure_probability: Math.round(failureProbability),
    days_until_failure: daysUntilFailure,
    recommended_action: '',
    urgency
  };
}

// 1. Predict Component Failures
app.get('/api/predictive/component-failures/:vehicleId', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const query = `
      SELECT 
        anomaly_type,
        COUNT(*) as count,
        AVG(temperature) as avg_temp,
        AVG(oil_pressure) as avg_oil_pressure,
        AVG(battery_voltage) as avg_battery,
        AVG(vibration) as avg_vibration
      FROM sensor_readings
      WHERE vehicle_id = $1 AND timestamp > NOW() - INTERVAL '90 days'
      GROUP BY anomaly_type
    `;

    const result = await pool.query(query, [vehicleId]);
    
    const predictions: ComponentHealth[] = [];

    // Battery prediction
    const batteryAnomalies = result.rows.find(r => r.anomaly_type === 'battery_issue');
    if (batteryAnomalies) {
      const battery = predictComponentFailure(batteryAnomalies.count, batteryAnomalies.avg_battery || 13, [12, 14.4]);
      battery.component = 'Battery';
      battery.recommended_action = 'Schedule battery replacement';
      predictions.push(battery);
    }

    // Oil system prediction
    const oilAnomalies = result.rows.find(r => r.anomaly_type === 'low_oil_pressure');
    if (oilAnomalies) {
      const oil = predictComponentFailure(oilAnomalies.count, oilAnomalies.avg_oil_pressure || 45, [25, 65]);
      oil.component = 'Oil System';
      oil.recommended_action = 'Schedule oil change and system inspection';
      predictions.push(oil);
    }

    // Cooling system prediction
    const coolingAnomalies = result.rows.find(r => r.anomaly_type === 'overheating');
    if (coolingAnomalies) {
      const cooling = predictComponentFailure(coolingAnomalies.count, coolingAnomalies.avg_temp || 95, [75, 110]);
      cooling.component = 'Cooling System';
      cooling.recommended_action = 'Schedule cooling system inspection';
      predictions.push(cooling);
    }

    // Suspension prediction
    const vibrationAnomalies = result.rows.find(r => r.anomaly_type === 'high_vibration');
    if (vibrationAnomalies) {
      const suspension = predictComponentFailure(vibrationAnomalies.count, vibrationAnomalies.avg_vibration || 0.5, [0.1, 0.8]);
      suspension.component = 'Suspension';
      suspension.recommended_action = 'Schedule wheel alignment and suspension inspection';
      predictions.push(suspension);
    }

    // Tire prediction
    const tireAnomalies = result.rows.find(r => r.anomaly_type === 'low_tire_pressure');
    if (tireAnomalies) {
      const tire = predictComponentFailure(tireAnomalies.count, 30, [25, 35]);
      tire.component = 'Tires';
      tire.recommended_action = 'Check tire pressure and inspect for damage';
      predictions.push(tire);
    }

    // Sort by urgency and failure probability
    predictions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return b.failure_probability - a.failure_probability;
    });

    res.json({
      vehicle_id: vehicleId,
      prediction_date: new Date().toISOString(),
      components: predictions,
      critical_count: predictions.filter(p => p.urgency === 'critical').length,
      high_count: predictions.filter(p => p.urgency === 'high').length
    });
  } catch (error) {
    logger.error('Component failure prediction error:', error);
    res.status(500).json({ error: 'Failed to predict component failures' });
  }
});

// 2. Maintenance Schedule Recommendation
app.get('/api/predictive/maintenance-schedule/:vehicleId', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const query = `
      SELECT 
        MAX(timestamp) as last_reading,
        COUNT(*) as total_readings,
        COUNT(CASE WHEN is_anomaly = true THEN 1 END) as anomalies
      FROM sensor_readings
      WHERE vehicle_id = $1
    `;

    const result = await pool.query(query, [vehicleId]);
    const { last_reading, total_readings, anomalies } = result.rows[0];

    const schedule = [
      {
        service: 'Oil Change',
        interval_miles: 5000,
        interval_months: 6,
        priority: 'high',
        estimated_cost: 50,
        description: 'Regular oil change to maintain engine health'
      },
      {
        service: 'Tire Rotation',
        interval_miles: 7500,
        interval_months: 6,
        priority: 'medium',
        estimated_cost: 40,
        description: 'Rotate tires for even wear'
      },
      {
        service: 'Air Filter Replacement',
        interval_miles: 15000,
        interval_months: 12,
        priority: 'medium',
        estimated_cost: 30,
        description: 'Replace air filter for optimal engine performance'
      },
      {
        service: 'Spark Plugs',
        interval_miles: 30000,
        interval_months: 24,
        priority: 'low',
        estimated_cost: 150,
        description: 'Replace spark plugs for efficient combustion'
      },
      {
        service: 'Brake Pads',
        interval_miles: 50000,
        interval_months: 36,
        priority: 'high',
        estimated_cost: 300,
        description: 'Replace brake pads for safety'
      },
      {
        service: 'Battery Replacement',
        interval_miles: 100000,
        interval_months: 48,
        priority: anomalies > 5 ? 'high' : 'medium',
        estimated_cost: 150,
        description: 'Replace battery to ensure reliable starting'
      },
      {
        service: 'Transmission Service',
        interval_miles: 60000,
        interval_months: 36,
        priority: 'medium',
        estimated_cost: 200,
        description: 'Service transmission fluid and filter'
      },
      {
        service: 'Coolant Flush',
        interval_miles: 50000,
        interval_months: 36,
        priority: 'medium',
        estimated_cost: 100,
        description: 'Flush and replace coolant'
      }
    ];

    // Adjust priority based on anomalies
    const adjustedSchedule = schedule.map(s => ({
      ...s,
      priority: anomalies > 10 ? 'high' : s.priority
    }));

    res.json({
      vehicle_id: vehicleId,
      last_service_date: last_reading,
      total_anomalies: anomalies,
      recommended_schedule: adjustedSchedule,
      total_estimated_annual_cost: adjustedSchedule.reduce((sum, s) => sum + s.estimated_cost, 0)
    });
  } catch (error) {
    logger.error('Maintenance schedule error:', error);
    res.status(500).json({ error: 'Failed to generate maintenance schedule' });
  }
});

// 3. Remaining Useful Life (RUL) Estimation
app.get('/api/predictive/rul/:vehicleId', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const query = `
      SELECT 
        COUNT(*) as total_readings,
        COUNT(CASE WHEN is_anomaly = true THEN 1 END) as anomalies,
        AVG(temperature) as avg_temp,
        AVG(oil_pressure) as avg_oil_pressure,
        AVG(battery_voltage) as avg_battery,
        MAX(timestamp) as last_reading
      FROM sensor_readings
      WHERE vehicle_id = $1 AND timestamp > NOW() - INTERVAL '365 days'
    `;

    const result = await pool.query(query, [vehicleId]);
    const { total_readings, anomalies, avg_temp, avg_oil_pressure, avg_battery } = result.rows[0];

    // Calculate RUL based on multiple factors
    const anomalyRate = (anomalies / total_readings) * 100;
    const tempDegradation = Math.max(0, (avg_temp - 95) / 20); // Normalized 0-1
    const oilDegradation = Math.max(0, (45 - avg_oil_pressure) / 20); // Normalized 0-1
    const batteryDegradation = Math.max(0, (13.8 - avg_battery) / 1.8); // Normalized 0-1

    // Weighted RUL calculation
    const degradationScore = (
      (anomalyRate * 0.4) +
      (tempDegradation * 100 * 0.2) +
      (oilDegradation * 100 * 0.2) +
      (batteryDegradation * 100 * 0.2)
    );

    const rulYears = Math.max(1, 10 - (degradationScore / 10));
    const rulMiles = Math.max(50000, 300000 - (degradationScore * 1000));

    res.json({
      vehicle_id: vehicleId,
      remaining_useful_life: {
        years: Math.round(rulYears * 10) / 10,
        miles: Math.round(rulMiles),
        confidence: Math.round((100 - degradationScore) * 10) / 10
      },
      degradation_factors: {
        anomaly_rate: Math.round(anomalyRate * 100) / 100,
        temperature_degradation: Math.round(tempDegradation * 100),
        oil_system_degradation: Math.round(oilDegradation * 100),
        battery_degradation: Math.round(batteryDegradation * 100)
      },
      recommendation: rulYears < 2 ? 'Consider replacement soon' : 'Vehicle in good condition'
    });
  } catch (error) {
    logger.error('RUL estimation error:', error);
    res.status(500).json({ error: 'Failed to estimate RUL' });
  }
});

// 4. Parts Inventory Recommendation
app.get('/api/predictive/parts-inventory', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        anomaly_type,
        COUNT(*) as count
      FROM sensor_readings
      WHERE is_anomaly = true AND timestamp > NOW() - INTERVAL '30 days'
      GROUP BY anomaly_type
      ORDER BY count DESC
    `;

    const result = await pool.query(query);

    const partsMap: { [key: string]: any } = {
      'battery_issue': { part: 'Battery', quantity: 2, cost: 150 },
      'low_oil_pressure': { part: 'Oil Filter', quantity: 5, cost: 15 },
      'overheating': { part: 'Coolant', quantity: 10, cost: 20 },
      'high_vibration': { part: 'Spark Plugs', quantity: 8, cost: 20 },
      'low_tire_pressure': { part: 'Tire Sealant', quantity: 5, cost: 30 }
    };

    const inventory = result.rows.map(row => ({
      anomaly_type: row.anomaly_type,
      occurrences: row.count,
      recommended_part: partsMap[row.anomaly_type]?.part || 'Unknown',
      recommended_quantity: Math.ceil((row.count / 10) * (partsMap[row.anomaly_type]?.quantity || 1)),
      estimated_cost: Math.ceil((row.count / 10) * (partsMap[row.anomaly_type]?.cost || 0))
    }));

    res.json({
      period: '30 days',
      recommended_inventory: inventory,
      total_estimated_cost: inventory.reduce((sum, item) => sum + item.estimated_cost, 0)
    });
  } catch (error) {
    logger.error('Parts inventory error:', error);
    res.status(500).json({ error: 'Failed to generate parts inventory' });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Predictive Maintenance Service running on port ${PORT}`);
});

export default app;
