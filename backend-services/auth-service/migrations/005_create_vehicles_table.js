exports.up = function(knex) {
  return knex.schema.createTable('vehicles', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('make').notNullable();
    table.string('model').notNullable();
    table.integer('year').notNullable();
    table.string('vin').unique();
    table.string('license_plate').unique();
    table.string('color');
    table.integer('mileage').defaultTo(0);
    table.string('status').defaultTo('active');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('vehicles');
};
