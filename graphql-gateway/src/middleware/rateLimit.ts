import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 1000; // per window

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();

  // Clean up expired entries
  Object.keys(store).forEach(key => {
    const entry = store[key];
    if (entry && entry.resetTime < now) {
      delete store[key];
    }
  });

  // Initialize or get client data
  if (!store[clientId]) {
    store[clientId] = {
      count: 1,
      resetTime: now + WINDOW_MS
    };
  } else {
    store[clientId].count += 1;
  }

  const clientData = store[clientId];

  // Set headers
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS - clientData.count).toString(),
    'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
  });

  // Check if rate limit exceeded
  if (clientData.count > MAX_REQUESTS) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        resetTime: new Date(clientData.resetTime).toISOString()
      }
    });
    return;
  }

  next();
};