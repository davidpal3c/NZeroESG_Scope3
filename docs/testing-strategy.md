# NZeroESG Testing Strategy & Implementation Guide

## Overview

This document outlines the comprehensive testing strategy for the NZeroESG multi-phase GraphQL Gateway system. The testing framework is designed to support all phases of development while providing CI/CD pipeline integration for automated testing.

## 🏗️ Testing Architecture

### Phase-Based Testing Structure
```
testing/
├── __tests__/
│   ├── phase1/
│   │   ├── auth-service/         # Phase 1: Authentication tests
│   │   ├── graphql-gateway/      # Phase 1: Gateway orchestration tests
│   │   └── integration/          # Phase 1: End-to-end integration tests
│   ├── phase2/
│   │   ├── vendor-service/       # Phase 2: Vendor management tests
│   │   ├── compliance-service/   # Phase 2: Compliance tests
│   │   └── integration/          # Phase 2: Extended integration tests
│   └── phase3/
│       ├── ai-agent-migration/   # Phase 3: AI agent integration tests
│       ├── performance/          # Phase 3: Load and performance tests
│       └── e2e/                  # Phase 3: Complete system tests
├── fixtures/                     # Test data and mock responses
├── utils/                        # Testing utilities and helpers
└── config/                       # Test environment configurations
```

## 🧪 Testing Levels

### 1. Unit Tests
- **Auth Service**: JWT validation, password hashing, database operations
- **GraphQL Gateway**: Resolver logic, schema validation, context handling
- **Vendor Service** (Phase 2): CRUD operations, data validation
- **AI Agent Integration** (Phase 3): Service communication, error handling

### 2. Integration Tests
- **Database Integration**: Connection handling, transaction management
- **Service Communication**: Inter-service API calls, authentication flow
- **GraphQL Schema**: End-to-end query/mutation execution
- **External API Integration**: Carbon Interface API, embedding services

### 3. End-to-End Tests
- **User Journey Tests**: Registration → Login → Vendor Management → AI Queries
- **Multi-Service Workflows**: Authentication → GraphQL → Service Orchestration
- **Error Handling**: Network failures, service unavailability, invalid data
- **Performance Tests**: Load testing, concurrency, response times

## 🛠️ Technology Stack

### Core Testing Libraries
- **Jest**: Main testing framework for all JavaScript/TypeScript tests
- **Supertest**: HTTP assertion library for API endpoint testing
- **GraphQL Testing Tools**: 
  - `@apollo/server/testing` - Apollo Server testing utilities
  - `graphql` - Schema validation and query execution testing
- **Database Testing**:
  - `@testcontainers/postgresql` - Isolated PostgreSQL containers for tests
  - `pg` - PostgreSQL client for test database operations
- **Docker Testing**: `testcontainers` for service isolation during tests

### CI/CD Integration
- **GitHub Actions**: Automated test execution on PR and merge
- **Docker Compose**: Isolated test environments
- **Test Coverage**: Istanbul/NYC for coverage reporting
- **Test Reports**: JUnit XML format for CI/CD integration

## 📋 Phase 1 Testing Implementation

### Auth Service Tests
```javascript
// Example: Authentication endpoint tests
describe('Auth Service - Phase 1', () => {
  describe('POST /auth/register', () => {
    it('should create new user with valid data');
    it('should hash password securely');
    it('should return JWT token');
    it('should reject duplicate emails');
    it('should validate input data');
  });

  describe('POST /auth/login', () => {
    it('should authenticate valid credentials');
    it('should reject invalid credentials');
    it('should return valid JWT token');
  });

  describe('JWT Middleware', () => {
    it('should validate JWT tokens');
    it('should reject expired tokens');
    it('should extract user context');
  });
});
```

### GraphQL Gateway Tests
```javascript
// Example: GraphQL resolver tests
describe('GraphQL Gateway - Phase 1', () => {
  describe('User Resolvers', () => {
    it('should fetch current user with valid token');
    it('should reject unauthenticated requests');
  });

  describe('Vendor Resolvers', () => {
    it('should return mock vendor data');
    it('should filter vendors by region');
    it('should handle pagination');
  });

  describe('Schema Integration', () => {
    it('should validate GraphQL schema');
    it('should execute complex queries');
    it('should handle mutations properly');
  });
});
```

### Integration Tests
```javascript
// Example: End-to-end workflow tests
describe('Phase 1 Integration Tests', () => {
  describe('User Authentication Flow', () => {
    it('should complete full registration → login → authenticated query flow');
    it('should handle token refresh');
    it('should maintain session state');
  });

  describe('GraphQL → Auth Service Integration', () => {
    it('should validate tokens via auth service');
    it('should handle auth service unavailability');
    it('should pass user context correctly');
  });
});
```

## 🎯 Phase 2 & 3 Testing Roadmap

### Phase 2: Extended Service Testing
- **Vendor Service**: CRUD operations, data validation, business logic
- **Compliance Service**: Regulatory checks, audit trails, reporting
- **Extended Integration**: Multi-service transactions, data consistency

### Phase 3: AI Agent & Performance Testing
- **AI Agent Integration**: LangChain workflows, RAG system testing
- **Performance Testing**: Load testing with k6, stress testing
- **End-to-End Scenarios**: Complete user workflows, edge cases

## 🏃 Running Tests

### Local Development
```bash
# Install dependencies
npm install

# Run all Phase 1 tests
npm run test:phase1

# Run specific test suites
npm run test:auth
npm run test:graphql
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Docker Testing Environment
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run tests in containers
docker-compose -f docker-compose.test.yml run tests

# Cleanup test environment
docker-compose -f docker-compose.test.yml down -v
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Phase 1 Tests
on: [push, pull_request]

jobs:
  test-phase1:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Phase 1 tests
        run: npm run test:phase1
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

## 📊 Test Data Management

### Test Fixtures
```javascript
// fixtures/users.js
export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'SecurePassword123!',
    role: 'CUSTOMER'
  },
  adminUser: {
    email: 'admin@nzeroesg.com',
    password: 'AdminPassword123!',
    role: 'ADMIN'
  }
};

// fixtures/vendors.js
export const testVendors = [
  {
    name: 'EcoWrap Test Ltd',
    region: 'Canada',
    description: 'Test vendor for automated testing',
    esgRating: 8.9
  }
];
```

### Database Seeding
```javascript
// utils/testDb.js
export async function seedTestDatabase() {
  // Create test data
  // Setup user accounts
  // Initialize vendor records
  // Prepare mock data for each phase
}

export async function cleanupTestDatabase() {
  // Remove test data
  // Reset sequences
  // Clear temporary files
}
```

## 🎨 Best Practices

### Test Organization
1. **Descriptive Names**: Use clear, specific test descriptions
2. **Setup/Teardown**: Proper test isolation and cleanup
3. **Mock Strategy**: Mock external services, use real database
4. **Data Management**: Consistent test data across environments

### Code Coverage Goals
- **Phase 1**: Minimum 80% coverage for auth and GraphQL gateway
- **Phase 2**: Maintain 80%+ coverage as services expand
- **Phase 3**: 85%+ coverage including AI agent integration

### Performance Benchmarks
- **API Response Times**: < 200ms for simple queries, < 1s for complex operations
- **Database Operations**: < 100ms for CRUD operations
- **GraphQL Queries**: < 500ms for typical user workflows
- **Authentication**: < 50ms for JWT validation

## 🚀 Continuous Improvement

### Metrics & Monitoring
- **Test Execution Time**: Track and optimize slow tests
- **Flaky Test Detection**: Identify and fix unreliable tests
- **Coverage Trends**: Monitor coverage changes over time
- **Performance Regression**: Detect performance degradation

### Documentation Updates
- **Test Results**: Document known issues and workarounds
- **New Test Cases**: Add tests for bug fixes and new features
- **CI/CD Evolution**: Update pipeline configurations as system grows

## 🔧 Troubleshooting

### Common Issues
1. **Database Connection**: Ensure test database is running and accessible
2. **Service Dependencies**: Check Docker containers are healthy
3. **Environment Variables**: Verify test environment configuration
4. **Port Conflicts**: Ensure test ports don't conflict with development

### Debug Commands
```bash
# Check test database
npm run test:db:check

# Validate test environment
npm run test:env:validate

# Run tests with debug output
DEBUG=* npm run test:phase1

# Generate detailed test reports
npm run test:report
```

---

This testing strategy provides a solid foundation for automated testing across all phases of the NZeroESG system development, ensuring quality, reliability, and maintainability as the system grows.