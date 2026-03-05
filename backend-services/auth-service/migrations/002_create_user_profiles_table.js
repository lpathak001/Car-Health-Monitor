/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_profiles', function(table) {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('first_name', 50).notNullable();
    table.string('last_name', 50).notNullable();
    table.date('date_of_birth').nullable();
    table.text('address').nullable();
    table.string('city', 100).nullable();
    table.string('state', 50).nullable();
    table.string('zip_code', 20).nullable();
    table.string('country', 50).nullable();
    table.jsonb('preferences').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_profiles');
};