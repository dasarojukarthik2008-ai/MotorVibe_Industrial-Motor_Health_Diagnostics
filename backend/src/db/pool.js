const { Pool } = require('pg');
const config = require('../config/env');

if (!config.databaseUrl) {
  console.error('FATAL: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', {
      text,
      error: error.message,
      duration: `${Date.now() - start}ms`,
    });
    throw error;
  }
}

module.exports = {
  pool,
  query,
};
