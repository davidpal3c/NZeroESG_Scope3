import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
    code = 'FORBIDDEN';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not Found';
    code = 'NOT_FOUND';
  } else if (error.message.includes('timeout')) {
    statusCode = 504;
    message = 'Service Timeout';
    code = 'TIMEOUT_ERROR';
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
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};