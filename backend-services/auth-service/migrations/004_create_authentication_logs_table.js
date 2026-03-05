/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('authentication_logs', function(table) {
    table.uuid('id').primary();
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('email', 255).notNullable();
    table.enum('event_type', [
      'login_attempt', 
      'login_success', 
      'login_failure', 
      'logout', 
      'token_refresh', 
      'password_change'
    ]).notNullable();
    table.boolean('success').notNullable();
    table.string('ip_address', 45).notNullable(); // IPv6 support
    table.text('user_agent').notNullable();
    table.string('failure_reason', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('user_id');
    table.index('email');
    table.index('created_at');
    table.index('event_type');
    table.index(['user_id', 'created_at']);
    table.index(['email', 'created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('authentication_logs');
};