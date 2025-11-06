// Test user data fixtures for consistent testing
export const testUsers = {
  // Valid test user
  validUser: {
    email: 'test.user@nzeroesg.com',
    password: 'TestPassword123!',
    role: 'CUSTOMER'
  },

  // Admin user for privileged operations
  adminUser: {
    email: 'admin@nzeroesg.com',
    password: 'AdminPassword123!',
    role: 'ADMIN'
  },

  // Vendor user for vendor-specific operations
  vendorUser: {
    email: 'vendor@example.com',
    password: 'VendorPassword123!',
    role: 'VENDOR'
  },

  // Invalid data for negative testing
  invalidUsers: {
    missingEmail: {
      password: 'TestPassword123!',
      role: 'CUSTOMER'
    },
    invalidEmail: {
      email: 'invalid-email',
      password: 'TestPassword123!',
      role: 'CUSTOMER'
    },
    weakPassword: {
      email: 'weak@example.com',
      password: '123',
      role: 'CUSTOMER'
    },
    invalidRole: {
      email: 'invalid@example.com',
      password: 'TestPassword123!',
      role: 'INVALID_ROLE'
    }
  }
};

// JWT token fixtures for testing
export const testTokens = {
  // Valid token (will be generated during test setup)
  validToken: null,
  
  // Expired token for testing expiration handling
  expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAzNjAwfQ.expired',
  
  // Malformed token for testing invalid tokens
  malformedToken: 'invalid.token.here',
  
  // Token with invalid signature
  invalidSignature: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.invalid-signature'
};

// User response fixtures
export const userResponses = {
  // Successful registration response
  successfulRegistration: {
    user: {
      id: '1',
      email: 'test.user@nzeroesg.com',
      role: 'CUSTOMER',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    token: 'mock.jwt.token',
    success: true,
    message: 'Registration successful'
  },

  // Successful login response
  successfulLogin: {
    user: {
      id: '1',
      email: 'test.user@nzeroesg.com',
      role: 'CUSTOMER',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    token: 'mock.jwt.token',
    success: true,
    message: 'Login successful'
  },

  // Error responses
  errors: {
    emailAlreadyExists: {
      user: null,
      token: null,
      success: false,
      message: 'Email already exists'
    },
    invalidCredentials: {
      user: null,
      token: null,
      success: false,
      message: 'Invalid credentials'
    },
    validationError: {
      user: null,
      token: null,
      success: false,
      message: 'Validation failed'
    }
  }
};