/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('name', 100).notNullable();
    table.string('phone', 20).nullable();
    table.enum('status', ['active', 'inactive', 'locked']).defaultTo('active');
    table.boolean('email_verified').defaultTo(false);
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('last_login_at').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('email');
    table.index('status');
    table.index('created_at');
    table.index(['email', 'status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};