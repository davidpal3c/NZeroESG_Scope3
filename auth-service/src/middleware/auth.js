const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'TOKEN_MISSING',
        message: 'Authorization token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Invalid token'
      });
    }

    console.error('Token verification error:', error);
    return res.status(500).json({
      error: 'VERIFICATION_FAILED',
      message: 'Failed to verify token'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};