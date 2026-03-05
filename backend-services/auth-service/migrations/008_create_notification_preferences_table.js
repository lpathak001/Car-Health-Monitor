exports.up = function(knex) {
  return knex.schema.createTable('notification_preferences', function(table) {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('email_enabled').defaultTo(true);
    table.boolean('sms_enabled').defaultTo(false);
    table.boolean('push_enabled').defaultTo(true);
    table.boolean('slack_enabled').defaultTo(false);
    table.enum('alert_threshold', ['critical', 'warning', 'info']).defaultTo('warning');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('notification_preferences');
};
