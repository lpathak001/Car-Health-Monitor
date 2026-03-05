import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'car_health_monitor',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  
  // Connection Pool Settings
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  
  // Application Settings
  application_name: 'auth-service',
  statement_timeout: 30000,
  query_timeout: 30000,
  
  // SSL Configuration (disable for local development)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

export const pool = new Pool(dbConfig);

// Connection event handlers
pool.on('connect', (client) => {
  logger.info('New database client connected');
});

pool.on('error', (err) => {
  logger.error('Database pool error', { error: err.message });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Closing database pool...');
  await pool.end();
  process.exit(0);
});

export default pool;