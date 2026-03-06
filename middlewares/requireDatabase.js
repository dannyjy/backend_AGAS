const { hasDbConfig, isDbReady } = require('../db');

function requireDatabase(req, res, next) {
  if (!hasDbConfig || !isDbReady()) {
    return res.status(503).json({
      status: 'error',
      message: 'Database is not configured. Set DATABASE_URL and restart the server.'
    });
  }

  return next();
}

module.exports = {
  requireDatabase
};
