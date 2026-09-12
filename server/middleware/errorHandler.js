const errorHandler = (err, req, res, next) => {
  console.error('💥 Guild Server Error:', err);

  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Invalid resource identifier format: "${err.value}".`;
    return res.status(400).json({ success: false, message });
  }

  // Mongoose duplicate key (e.g. duplicate email or username) -> 409 Conflict
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    const message = field === 'email'
      ? `A hero with the email "${val}" is already inscribed in the Guild records.`
      : `A hero with this ${field} is already inscribed in the Guild records.`;
    return res.status(409).json({ success: false, message, field });
  }

  // Mongoose validation error -> 400 Bad Request
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return res.status(400).json({ success: false, message });
  }

  // JSON Web Token error -> 401 Unauthorized
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or forged Guild authentication token.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Guild authentication token has expired. Please log in again.'
    });
  }

  const statusCode = err.statusCode || res.statusCode >= 400 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Guild Server Exception'
  });
};

module.exports = errorHandler;
