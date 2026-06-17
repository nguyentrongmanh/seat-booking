const { Client } = require('pg');

module.exports = async function () {
  const client = new Client({
    host: process.env.TEST_DB_HOST || 'localhost',
    port: Number(process.env.TEST_DB_PORT) || 5432,
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    database: 'postgres',
  });

  await client.connect();

  const { rows } = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = 'seat_reservation_test'",
  );

  if (rows.length === 0) {
    await client.query('CREATE DATABASE seat_reservation_test');
  }

  await client.end();
};
