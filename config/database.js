const { Pool } = require('pg');

const hasDbConfig = Boolean(process.env.DATABASE_URL);

const pool = hasDbConfig
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    })
  : null;

module.exports = {
  pool,
  hasDbConfig
};
