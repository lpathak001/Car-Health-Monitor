exports.up = function(knex) {
  return knex.schema.createTable('alerts', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('vehicle_id').notNullable().references('id').inTable('vehicles').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('alert_type', ['critical', 'warning', 'info']).notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.json('channels').defaultTo(JSON.stringify(['email']));
    table.boolean('read').defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('vehicle_id');
    table.index('alert_type');
    table.index(['user_id', 'read']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('alerts');
};
