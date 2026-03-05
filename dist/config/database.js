"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const logger_1 = require("../utils/logger");
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'car_health_monitor',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
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
exports.pool = new pg_1.Pool(dbConfig);
// Connection event handlers
exports.pool.on('connect', (client) => {
    logger_1.logger.info('New database client connected');
});
exports.pool.on('error', (err) => {
    logger_1.logger.error('Database pool error', { error: err.message });
});
// Graceful shutdown
process.on('SIGINT', async () => {
    logger_1.logger.info('Closing database pool...');
    await exports.pool.end();
    process.exit(0);
});
exports.default = exports.pool;
//# sourceMappingURL=database.js.map