import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header or cookies
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies) {
      token = req.cookies.accessToken;
    }

    // Skip auth for health checks and introspection
    if (req.path === '/health' || req.body?.query?.includes('__schema')) {
      return next();
    }

    // If no token provided, continue without user (some queries might be public)
    if (!token) {
      req.user = undefined;
      return next();
    }

    // Verify token locally first (faster)
    const JWT_SECRET = process.env.JWT_SECRET;
    if (JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // Set user context
        req.user = {
          id: decoded.userId || decoded.id,
          email: decoded.email,
          role: decoded.role || 'customer',
          permissions: decoded.permissions || []
        };
        
        return next();
      } catch (jwtError) {
        console.warn('JWT local verification failed, trying auth service:', jwtError);
      }
    }

    // Fallback: verify with auth service
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    
    try {
      const response = await axios.get(`${authServiceUrl}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000 // 5 second timeout
      });

      if (response.data && response.data.user) {
        req.user = {
          id: response.data.user.id,
          email: response.data.user.email,
          role: response.data.user.role,
          permissions: response.data.user.permissions || []
        };
      }
    } catch (authServiceError) {
      console.error('Auth service verification failed:', authServiceError);
      
      // Don't fail the request, just continue without user
      // This allows public queries to still work
      req.user = undefined;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.user = undefined;
    next();
  }
};

// Helper function to require authentication
export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'You must be logged in to access this resource'
    });
    return;
  }
  next();
};

// Helper function to require specific role
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'You must be logged in to access this resource'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
      return;
    }

    next();
  };
};

// Helper function to check permissions
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'You must be logged in to access this resource'
      });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied. Required permission: ${permission}`
      });
      return;
    }

    next();
  };
};