const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/car_health_monitor'
});

async function insertTestData() {
  try {
    // Create a test user
    const userId = uuidv4();
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, status) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'test@analytics.com', 'hash', 'Test User', 'active']
    );
    console.log('✓ User created:', userId);

    // Create a test vehicle
    const vehicleId = uuidv4();
    await pool.query(
      `INSERT INTO vehicles (id, user_id, make, model, year, vin, license_plate, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [vehicleId, userId, 'Toyota', 'Camry', 2022, 'TEST123', 'TEST001', 'active']
    );
    console.log('✓ Vehicle created:', vehicleId);

    // Insert sample sensor readings
    for (let i = 0; i < 20; i++) {
      const readingId = uuidv4();
      const temp = 75 + Math.random() * 30;
      const oil = 40 + Math.random() * 20;
      const battery = 13 + Math.random() * 2;
      const vibration = Math.random() * 0.5;
      const rpm = 1000 + Math.random() * 3000;
      const speed = 20 + Math.random() * 60;
      const isAnomaly = Math.random() > 0.8;
      
      await pool.query(
        `INSERT INTO sensor_readings 
         (id, vehicle_id, temperature, oil_pressure, battery_voltage, vibration, rpm, speed, is_anomaly, anomaly_type, health_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [readingId, vehicleId, temp, oil, battery, vibration, rpm, speed, isAnomaly, 
         isAnomaly ? 'high_temperature' : null, isAnomaly ? 70 : 95]
      );
    }
    console.log('✓ 20 sensor readings inserted');

    // Test the analytics query
    const result = await pool.query(`
      SELECT 
        v.id,
        v.make,
        v.model,
        v.year,
        COUNT(sr.id) as total_readings,
        COUNT(CASE WHEN sr.is_anomaly = true THEN 1 END) as anomalies,
        ROUND(100 - (COUNT(CASE WHEN sr.is_anomaly = true THEN 1 END)::float / COUNT(sr.id) * 100)::numeric, 2)::float as health_score
      FROM vehicles v
      LEFT JOIN sensor_readings sr ON v.id = sr.vehicle_id
      GROUP BY v.id, v.make, v.model, v.year
    `);
    
    console.log('\n✓ Analytics Query Result:');
    console.log(JSON.stringify(result.rows, null, 2));

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

insertTestData();
