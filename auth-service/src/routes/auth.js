const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const { User, UserSession } = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'vendor', 'customer']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      issuer: 'nzeroesg-auth',
      audience: 'nzeroesg-app'
    }
  );

  const refreshToken = jwt.sign(
    { 
      userId: user.id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'nzeroesg-auth',
      audience: 'nzeroesg-app'
    }
  );

  return { accessToken, refreshToken };
};

// POST /auth/register
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { email, password, role = 'customer' } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'USER_EXISTS',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const user = await User.create({
      id: userId,
      email,
      passwordHash,
      role,
      isActive: true
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    await UserSession.create({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Return success response (don't include password hash)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'REGISTRATION_FAILED',
      message: 'Failed to register user'
    });
  }
});

// POST /auth/login
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'ACCOUNT_DISABLED',
        message: 'Account is disabled'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    await UserSession.create({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Return success response
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'LOGIN_FAILED',
      message: 'Failed to login'
    });
  }
});

// GET /auth/verify
router.get('/verify', async (req, res) => {
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
    
    // Get user details
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'INVALID_USER',
        message: 'User not found or inactive'
      });
    }

    res.json({
      message: 'Token valid',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions || []
      }
    });

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
    res.status(500).json({
      error: 'VERIFICATION_FAILED',
      message: 'Failed to verify token'
    });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'REFRESH_TOKEN_MISSING',
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if refresh token exists in database
    const session = await UserSession.findByRefreshToken(refreshToken);
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token'
      });
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'INVALID_USER',
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token in database
    await UserSession.updateRefreshToken(session.id, newRefreshToken);

    res.json({
      message: 'Tokens refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      error: 'REFRESH_FAILED',
      message: 'Failed to refresh token'
    });
  }
});

// POST /auth/logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    // Remove refresh token from database
    if (refreshToken) {
      await UserSession.deleteByRefreshToken(refreshToken);
    } else {
      // Remove all sessions for user
      await UserSession.deleteByUserId(userId);
    }

    res.json({
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'LOGOUT_FAILED',
      message: 'Failed to logout'
    });
  }
});

module.exports = router;