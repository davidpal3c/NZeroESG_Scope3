const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
  } else if (error.code === '23505') { // PostgreSQL unique constraint violation
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
  } else if (error.code === '23503') { // PostgreSQL foreign key constraint violation
    statusCode = 400;
    message = 'Invalid reference';
    code = 'INVALID_REFERENCE';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // Don't leak internal details in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) {
      message = 'Something went wrong';
    }
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error
      })
    }
  });
};

module.exports = {
  errorHandler
};