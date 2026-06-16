require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../src/config/db');

async function migrate() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Running migrations...');

    const [cols] = await conn.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'notes'
    `);
    if (cols.length === 0) {
      await conn.execute(`ALTER TABLE orders ADD COLUMN notes TEXT NULL AFTER order_status`);
      console.log('✓ Added orders.notes column.');
    } else {
      console.log('✓ orders.notes column already exists, skipping.');
    }
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

migrate();
