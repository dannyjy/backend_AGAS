const { Pool } = require('pg');

const hasDbConfig = Boolean(process.env.DATABASE_URL);

// Production databases (DigitalOcean, Azure, etc.) use SSL with self-signed certs
// Always enable SSL when DATABASE_URL is present
const pool = hasDbConfig
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }  // Accept managed database SSL certificates
    })
  : null;

module.exports = {
  pool,
  hasDbConfig
};
