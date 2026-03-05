exports.up = function(knex) {
  return knex.schema.createTable('sensor_readings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('vehicle_id').notNullable().references('id').inTable('vehicles').onDelete('CASCADE');
    table.float('temperature').notNullable();
    table.float('oil_pressure').notNullable();
    table.float('battery_voltage').notNullable();
    table.float('vibration').notNullable();
    table.float('rpm').notNullable();
    table.float('speed').notNullable();
    table.boolean('is_anomaly').defaultTo(false);
    table.string('anomaly_type');
    table.float('anomaly_score').defaultTo(0);
    table.integer('health_score').defaultTo(100);
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.index('vehicle_id');
    table.index('timestamp');
    table.index('is_anomaly');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('sensor_readings');
};
