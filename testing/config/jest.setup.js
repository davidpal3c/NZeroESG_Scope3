// Jest setup file for global test configuration
const { config } = require('dotenv');

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting NZeroESG Test Suite');
  console.log(`📊 Node Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Configured' : 'Missing'}`);
});

afterAll(() => {
  console.log('✅ Test Suite Completed');
});

// Global test utilities
global.testConfig = {
  auth: {
    baseUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    testUser: {
      email: 'test@nzeroesg.com',
      password: 'TestPassword123!',
      role: 'CUSTOMER'
    },
    adminUser: {
      email: 'admin@nzeroesg.com', 
      password: 'AdminPassword123!',
      role: 'ADMIN'
    }
  },
  graphql: {
    baseUrl: process.env.GRAPHQL_GATEWAY_URL || 'http://localhost:4000',
    endpoint: '/graphql'
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:test@localhost:5433/nzeroesg_test'
  },
  timeouts: {
    short: 5000,    // 5 seconds for quick operations
    medium: 15000,  // 15 seconds for API calls
    long: 30000     // 30 seconds for complex operations
  }
};

// Enhanced error logging for tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (process.env.NODE_ENV === 'test') {
    // Only log errors in test environment if explicitly enabled
    if (process.env.LOG_TEST_ERRORS === 'true') {
      originalConsoleError.apply(console, args);
    }
  } else {
    originalConsoleError.apply(console, args);
  }
};