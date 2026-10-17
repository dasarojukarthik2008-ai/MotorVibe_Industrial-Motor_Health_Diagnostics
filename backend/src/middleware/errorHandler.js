function errorHandler(err, req, res, _next) {
  console.error('Request failed:', {
    method: req.method,
    url: req.originalUrl,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message,
  });

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Username or email is already registered.',
    });
  }

  const connectionFailure = typeof err.code === 'string'
    && (err.code.startsWith('08') || err.code.startsWith('28')
      || ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '57P01', '3D000', '3F000'].includes(err.code));
  if (connectionFailure) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is unavailable. Check that PostgreSQL is running and DATABASE_URL is correct.',
    });
  }

  if (err.code === '42P01') {
    return res.status(503).json({
      success: false,
      message: 'The PostgreSQL schema is not initialized. Run npm run db:init and try again.',
    });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode < 500 ? err.message : 'The server could not complete the request.',
  });
}

module.exports = errorHandler;
