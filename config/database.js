const { Pool } = require('pg');

const hasDbConfig = Boolean(process.env.DATABASE_URL);

// For managed databases (DigitalOcean, Azure, etc.), we need to handle SSL properly
// Remove or replace sslmode parameter and configure SSL in pool config instead
let connectionString = process.env.DATABASE_URL;
if (hasDbConfig && connectionString) {
  // Remove sslmode parameter from connection string if present
  connectionString = connectionString.replace(/[?&]sslmode=[^&]*/, '');
}

const pool = hasDbConfig
  ? new Pool({
      connectionString: connectionString,
      ssl: { 
        rejectUnauthorized: false  // Accept self-signed certs from managed databases
      }
    })
  : null;

module.exports = {
  pool,
  hasDbConfig
};
