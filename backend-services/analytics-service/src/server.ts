import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import { createClient } from 'redis';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 3005;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'analytics.log' })
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
    service: 'analytics-service',
    timestamp: new Date().toISOString()
  });
});

// 1. Fleet Health Summary
app.get('/api/analytics/fleet-health', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'fleet-health-summary';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const query = `
      SELECT 
        v.id,
        v.make,
        v.model,
        v.year,
        COUNT(sr.id) as total_readings,
        COUNT(CASE WHEN sr.is_anomaly = true THEN 1 END) as anomalies,
        ROUND(100 - (COUNT(CASE WHEN sr.is_anomaly = true THEN 1 END)::float / COUNT(sr.id) * 100), 2) as health_score,
        AVG(sr.temperature) as avg_temperature,
        AVG(sr.oil_pressure) as avg_oil_pressure,
        AVG(sr.battery_voltage) as avg_battery_voltage
      FROM vehicles v
      LEFT JOIN sensor_readings sr ON v.id = sr.vehicle_id
      GROUP BY v.id, v.make, v.model, v.year
      ORDER BY health_score DESC
    `;

    const result = await pool.query(query);
    const response = {
      timestamp: new Date().toISOString(),
      fleet_size: result.rows.length,
      vehicles: result.rows,
      overall_health: result.rows.length > 0 
        ? (result.rows.reduce((sum: number, v: any) => sum + v.health_score, 0) / result.rows.length).toFixed(2)
        : 0
    };

    await redis.setEx(cacheKey, 300, JSON.stringify(response));
    res.json(response);
  } catch (error) {
    logger.error('Fleet health error:', error);
    res.status(500).json({ error: 'Failed to fetch fleet health' });
  }
});

// 2. Vehicle Health Trends
app.get('/api/analytics/vehicle/:vehicleId/trends', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as readings,
        COUNT(CASE WHEN is_anomaly = true THEN 1 END) as anomalies,
        ROUND(100 - (COUNT(CASE WHEN is_anomaly = true THEN 1 END)::float / COUNT(*) * 100), 2) as health_score,
        AVG(temperature) as avg_temp,
        AVG(oil_pressure) as avg_oil_pressure,
        AVG(battery_voltage) as avg_battery
      FROM sensor_readings
      WHERE vehicle_id = $1 AND timestamp > NOW() - INTERVAL '1 day' * $2
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

    const result = await pool.query(query, [vehicleId, days]);
    res.json({
      vehicle_id: vehicleId,
      period_days: days,
      trends: result.rows
    });
  } catch (error) {
    logger.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// 3. Anomaly Analysis
app.get('/api/analytics/anomalies', async (req: Request, res: Response) => {
  try {
    const { vehicle_id, days = 30 } = req.query;

    let query = `
      SELECT 
        anomaly_type,
        COUNT(*) as count,
        ROUND(COUNT(*)::float / (SELECT COUNT(*) FROM sensor_readings WHERE timestamp > NOW() - INTERVAL '1 day' * $1) * 100, 2) as percentage,
        MAX(timestamp) as last_occurrence
      FROM sensor_readings
      WHERE is_anomaly = true AND timestamp > NOW() - INTERVAL '1 day' * $1
    `;

    const params: any[] = [days];

    if (vehicle_id) {
      query += ` AND vehicle_id = $2`;
      params.push(vehicle_id);
    }

    query += ` GROUP BY anomaly_type ORDER BY count DESC`;

    const result = await pool.query(query, params);
    res.json({
      period_days: days,
      total_anomalies: result.rows.reduce((sum: number, row: any) => sum + row.count, 0),
      anomalies_by_type: result.rows
    });
  } catch (error) {
    logger.error('Anomaly analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch anomaly analysis' });
  }
});

// 4. Cost Analysis
app.get('/api/analytics/cost-analysis', async (req: Request, res: Response) => {
  try {
    const { vehicle_id, period = 'month' } = req.query;

    const periodMap: { [key: string]: string } = {
      'week': '7 days',
      'month': '30 days',
      'quarter': '90 days',
      'year': '365 days'
    };

    const interval = periodMap[period as string] || '30 days';

    let query = `
      SELECT 
        v.id,
        v.make,
        v.model,
        COUNT(sr.id) as total_readings,
        COUNT(CASE WHEN sr.is_anomaly = true THEN 1 END) as anomalies,
        ROUND(COUNT(CASE WHEN sr.is_anomaly = true THEN 1 END)::float * 500, 2) as estimated_repair_cost,
        ROUND(COUNT(CASE WHEN sr.is_anomaly = true THEN 1 END)::float * 500 * 0.7, 2) as prevented_cost
      FROM vehicles v
      LEFT JOIN sensor_readings sr ON v.id = sr.vehicle_id AND sr.timestamp > NOW() - INTERVAL '${interval}'
    `;

    if (vehicle_id) {
      query += ` WHERE v.id = $1`;
    }

    query += ` GROUP BY v.id, v.make, v.model`;

    const result = await pool.query(query, vehicle_id ? [vehicle_id] : []);
    
    const totalRepairCost = result.rows.reduce((sum: number, row: any) => sum + (row.estimated_repair_cost || 0), 0);
    const totalPreventedCost = result.rows.reduce((sum: number, row: any) => sum + (row.prevented_cost || 0), 0);

    res.json({
      period,
      vehicles: result.rows,
      summary: {
        total_estimated_repair_cost: totalRepairCost,
        total_prevented_cost: totalPreventedCost,
        roi: totalRepairCost > 0 ? ((totalPreventedCost / totalRepairCost) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    logger.error('Cost analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch cost analysis' });
  }
});

// 5. Predictive Maintenance Recommendations
app.get('/api/analytics/maintenance-recommendations', async (req: Request, res: Response) => {
  try {
    const { vehicle_id } = req.query;

    let query = `
      SELECT 
        v.id,
        v.make,
        v.model,
        v.year,
        CASE 
          WHEN COUNT(CASE WHEN sr.anomaly_type = 'battery_issue' THEN 1 END) > 5 THEN 'Battery Replacement'
          WHEN COUNT(CASE WHEN sr.anomaly_type = 'low_oil_pressure' THEN 1 END) > 3 THEN 'Oil Change'
          WHEN COUNT(CASE WHEN sr.anomaly_type = 'high_vibration' THEN 1 END) > 5 THEN 'Wheel Alignment'
          WHEN COUNT(CASE WHEN sr.anomaly_type = 'low_tire_pressure' THEN 1 END) > 5 THEN 'Tire Inspection'
          WHEN COUNT(CASE WHEN sr.anomaly_type = 'overheating' THEN 1 END) > 3 THEN 'Cooling System Check'
          ELSE 'Routine Maintenance'
        END as recommended_service,
        CASE 
          WHEN COUNT(CASE WHEN sr.anomaly_type = 'battery_issue' THEN 1 END) > 5 THEN 'High'
          WHEN COUNT(CASE WHEN sr.anomaly_type = 'low_oil_pressure' THEN 1 END) > 3 THEN 'High'
          WHEN COUNT(CASE WHEN sr.anomaly_type = 'high_vibration' THEN 1 END) > 5 THEN 'Medium'
          WHEN COUNT(CASE WHEN sr.anomaly_type = 'low_tire_pressure' THEN 1 END) > 5 THEN 'Medium'
          ELSE 'Low'
        END as urgency,
        ROUND(COUNT(CASE WHEN sr.is_anomaly = true THEN 1 END)::float * 500, 2) as estimated_cost,
        MAX(sr.timestamp) as last_anomaly
      FROM vehicles v
      LEFT JOIN sensor_readings sr ON v.id = sr.vehicle_id AND sr.timestamp > NOW() - INTERVAL '30 days'
    `;

    if (vehicle_id) {
      query += ` WHERE v.id = $1`;
    }

    query += ` GROUP BY v.id, v.make, v.model, v.year HAVING COUNT(CASE WHEN sr.is_anomaly = true THEN 1 END) > 0`;

    const result = await pool.query(query, vehicle_id ? [vehicle_id] : []);
    res.json({
      recommendations: result.rows,
      total_vehicles_needing_service: result.rows.length
    });
  } catch (error) {
    logger.error('Maintenance recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance recommendations' });
  }
});

// 6. Export Report
app.get('/api/analytics/export/:format', async (req: Request, res: Response) => {
  try {
    const { format } = req.params;
    const { vehicle_id, days = 30 } = req.query;

    // Fetch data
    let query = `
      SELECT 
        v.id, v.make, v.model, v.year,
        COUNT(sr.id) as total_readings,
        COUNT(CASE WHEN sr.is_anomaly = true THEN 1 END) as anomalies,
        ROUND(100 - (COUNT(CASE WHEN sr.is_anomaly = true THEN 1 END)::float / COUNT(sr.id) * 100), 2) as health_score
      FROM vehicles v
      LEFT JOIN sensor_readings sr ON v.id = sr.vehicle_id AND sr.timestamp > NOW() - INTERVAL '1 day' * $1
    `;

    const params: any[] = [days];

    if (vehicle_id) {
      query += ` WHERE v.id = $2`;
      params.push(vehicle_id);
    }

    query += ` GROUP BY v.id, v.make, v.model, v.year`;

    const result = await pool.query(query, params);

    if (format === 'json') {
      res.json({
        generated_at: new Date().toISOString(),
        period_days: days,
        data: result.rows
      });
    } else if (format === 'csv') {
      const csv = 'Vehicle ID,Make,Model,Year,Total Readings,Anomalies,Health Score\n' +
        result.rows.map(row => 
          `${row.id},${row.make},${row.model},${row.year},${row.total_readings},${row.anomalies},${row.health_score}`
        ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.csv"');
      res.send(csv);
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Analytics Service running on port ${PORT}`);
});

export default app;
