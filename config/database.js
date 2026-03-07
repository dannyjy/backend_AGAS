const { Pool } = require('pg');

const hasDbConfig = Boolean(process.env.DATABASE_URL);

// Configure SSL for production databases (DigitalOcean, Azure, etc.)
const sslConfig = hasDbConfig && process.env.NODE_ENV === 'production'
  ? { rejectUnauthorized: false }  // Accept self-signed certificates from managed databases
  : process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false;

const pool = hasDbConfig
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig
    })
  : null;

module.exports = {
  pool,
  hasDbConfig
};
