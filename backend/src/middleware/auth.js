const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { query } = require('../db/pool');

async function requireAuth(req, res, next) {
  try {
    let token = null;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.motorvibe_token) {
      token = req.cookies.motorvibe_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Fallback for API clients / tools
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (_err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.',
      });
    }

    // Check user exists in PostgreSQL
    const userRes = await query(
      'SELECT id, name, username, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    req.user = userRes.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAuth,
};
