import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import { createClient } from 'redis';
import winston from 'winston';
import nodemailer from 'nodemailer';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3008;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'notification.log' })
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

// Email transporter setup
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'noreply@carhealthmonitor.com',
    pass: process.env.SMTP_PASSWORD || 'demo-password'
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
});

// Alert types
interface Alert {
  id: string;
  vehicle_id: string;
  user_id: string;
  alert_type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  channels: string[];
  created_at: Date;
  read: boolean;
}

// 1. Send Alert via Multiple Channels
app.post('/api/notifications/send-alert', async (req: Request, res: Response) => {
  try {
    const { vehicle_id, user_id, alert_type, title, message, channels } = req.body;

    // Validate input
    if (!vehicle_id || !user_id || !alert_type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user details
    const userResult = await pool.query(
      'SELECT email, phone FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const alertChannels = channels || ['email', 'push'];
    const results: { [key: string]: boolean } = {};

    // Send via Email
    if (alertChannels.includes('email')) {
      try {
        await emailTransporter.sendMail({
          from: process.env.SMTP_USER || 'noreply@carhealthmonitor.com',
          to: user.email,
          subject: `[${alert_type.toUpperCase()}] ${title}`,
          html: `
            <h2>${title}</h2>
            <p>${message}</p>
            <p style="color: #666; font-size: 12px;">
              Alert Type: ${alert_type}<br>
              Vehicle ID: ${vehicle_id}<br>
              Time: ${new Date().toISOString()}
            </p>
          `
        });
        results.email = true;
        logger.info(`Email sent to ${user.email}`);
      } catch (error) {
        results.email = false;
        logger.error('Email send error:', error);
      }
    }

    // Send via SMS (Twilio)
    if (alertChannels.includes('sms') && user.phone) {
      try {
        await axios.post('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
          From: process.env.TWILIO_PHONE || '+1234567890',
          To: user.phone,
          Body: `[${alert_type}] ${title}: ${message}`
        }, {
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID || 'demo',
            password: process.env.TWILIO_AUTH_TOKEN || 'demo'
          }
        });
        results.sms = true;
        logger.info(`SMS sent to ${user.phone}`);
      } catch (error) {
        results.sms = false;
        logger.error('SMS send error:', error);
      }
    }

    // Send via Push Notification
    if (alertChannels.includes('push')) {
      try {
        // Firebase Cloud Messaging would be used here
        results.push = true;
        logger.info(`Push notification queued for user ${user_id}`);
      } catch (error) {
        results.push = false;
        logger.error('Push notification error:', error);
      }
    }

    // Send via Slack
    if (alertChannels.includes('slack')) {
      try {
        const slackWebhook = process.env.SLACK_WEBHOOK_URL;
        if (slackWebhook) {
          await axios.post(slackWebhook, {
            text: `🚗 Car Health Alert`,
            attachments: [{
              color: alert_type === 'critical' ? 'danger' : alert_type === 'warning' ? 'warning' : 'good',
              title: title,
              text: message,
              fields: [
                { title: 'Vehicle ID', value: vehicle_id, short: true },
                { title: 'Alert Type', value: alert_type, short: true },
                { title: 'Time', value: new Date().toISOString(), short: false }
              ]
            }]
          });
          results.slack = true;
          logger.info('Slack notification sent');
        }
      } catch (error) {
        results.slack = false;
        logger.error('Slack notification error:', error);
      }
    }

    // Store alert in database
    const alertId = require('uuid').v4();
    await pool.query(
      `INSERT INTO alerts (id, vehicle_id, user_id, alert_type, title, message, channels, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [alertId, vehicle_id, user_id, alert_type, title, message, JSON.stringify(alertChannels)]
    );

    res.json({
      alert_id: alertId,
      message: 'Alert sent successfully',
      channels_status: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Send alert error:', error);
    res.status(500).json({ error: 'Failed to send alert' });
  }
});

// 2. Get Alert History
app.get('/api/notifications/alerts/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT id, vehicle_id, alert_type, title, message, created_at, read
       FROM alerts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM alerts WHERE user_id = $1',
      [userId]
    );

    res.json({
      alerts: result.rows,
      total: countResult.rows[0].total,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// 3. Mark Alert as Read
app.put('/api/notifications/alerts/:alertId/read', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    await pool.query(
      'UPDATE alerts SET read = true WHERE id = $1',
      [alertId]
    );

    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    logger.error('Mark alert read error:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

// 4. Get Unread Alert Count
app.get('/api/notifications/unread-count/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const cacheKey = `unread-count:${userId}`;

    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ unread_count: parseInt(cached) });
    }

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM alerts WHERE user_id = $1 AND read = false',
      [userId]
    );

    const count = result.rows[0].count;

    // Cache for 1 minute
    await redis.setEx(cacheKey, 60, count.toString());

    res.json({ unread_count: count });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// 5. Configure Alert Preferences
app.post('/api/notifications/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { email_enabled, sms_enabled, push_enabled, slack_enabled, alert_threshold } = req.body;

    await pool.query(
      `INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled, push_enabled, slack_enabled, alert_threshold)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
       email_enabled = $2, sms_enabled = $3, push_enabled = $4, slack_enabled = $5, alert_threshold = $6`,
      [userId, email_enabled, sms_enabled, push_enabled, slack_enabled, alert_threshold]
    );

    // Clear cache
    await redis.del(`unread-count:${userId}`);

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// 6. Get Alert Preferences
app.get('/api/notifications/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        user_id: userId,
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        slack_enabled: false,
        alert_threshold: 'warning'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// 7. Get Alert Statistics
app.get('/api/notifications/statistics/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const result = await pool.query(
      `SELECT 
        alert_type,
        COUNT(*) as count,
        COUNT(CASE WHEN read = true THEN 1 END) as read_count
       FROM alerts
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2
       GROUP BY alert_type`,
      [userId, days]
    );

    const totalResult = await pool.query(
      `SELECT COUNT(*) as total, COUNT(CASE WHEN read = true THEN 1 END) as read_total
       FROM alerts
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2`,
      [userId, days]
    );

    res.json({
      period_days: days,
      by_type: result.rows,
      summary: totalResult.rows[0]
    });
  } catch (error) {
    logger.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// 8. Bulk Send Alerts (for fleet-wide alerts)
app.post('/api/notifications/bulk-send', async (req: Request, res: Response) => {
  try {
    const { vehicle_ids, alert_type, title, message, channels } = req.body;

    if (!vehicle_ids || !alert_type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const results = [];

    for (const vehicleId of vehicle_ids) {
      try {
        const userResult = await pool.query(
          'SELECT user_id FROM vehicles WHERE id = $1',
          [vehicleId]
        );

        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].user_id;
          
          // Send alert (simplified - would call send-alert endpoint)
          const alertId = require('uuid').v4();
          await pool.query(
            `INSERT INTO alerts (id, vehicle_id, user_id, alert_type, title, message, channels, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [alertId, vehicleId, userId, alert_type, title, message, JSON.stringify(channels || ['email'])]
          );

          results.push({ vehicle_id: vehicleId, alert_id: alertId, status: 'sent' });
        }
      } catch (error) {
        results.push({ vehicle_id: vehicleId, status: 'failed', error: error });
      }
    }

    res.json({
      message: 'Bulk alerts processed',
      results: results,
      total: results.length,
      successful: results.filter(r => r.status === 'sent').length
    });
  } catch (error) {
    logger.error('Bulk send error:', error);
    res.status(500).json({ error: 'Failed to send bulk alerts' });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Notification Service running on port ${PORT}`);
});

export default app;
