// Authentication middleware (currently disabled for demo/hackathon)
// Default user: AGAS-2026-001

function requireBearerToken(req, res, next) {
  // Auth disabled for hackathon demo - all requests are allowed
  return next();
}

module.exports = {
  requireBearerToken
};
