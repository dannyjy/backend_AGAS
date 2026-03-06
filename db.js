const fs = require('fs');
const path = require('path');
const { pool, hasDbConfig } = require('./config/database');

let dbReady = false;

async function bootstrapDatabase() {
  if (!pool) {
    console.warn('DATABASE_URL not set. Running without PostgreSQL-backed APIs.');
    return;
  }

  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  await pool.query(schemaSql);
  dbReady = true;
  console.log('PostgreSQL schema is ready.');
}

function isDbReady() {
  return dbReady;
}

module.exports = {
  pool,
  hasDbConfig,
  bootstrapDatabase,
  isDbReady
};
