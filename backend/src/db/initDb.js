const fs = require('fs');
const path = require('path');
const { pool, query } = require('./pool');

async function initDb() {
  console.log('Initializing MotorVibe PostgreSQL database schema...');
  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    // Run schema commands
    await query(sql);
    console.log('✓ PostgreSQL tables and indexes verified/created successfully.');

    // Verify existing tables
    const res = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Active tables in database:', res.rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error('Failed to initialize database schema:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
