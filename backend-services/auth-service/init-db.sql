-- Initialize database for Car Health Monitor Authentication Service
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The database 'car_health_monitor' is already created by the POSTGRES_DB environment variable
-- Tables will be created by Knex migrations