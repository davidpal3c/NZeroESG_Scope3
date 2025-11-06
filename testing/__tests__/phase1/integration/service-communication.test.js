// Phase 1 Integration Tests - Service Communication
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { testUsers } from '../../fixtures/users.js';
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  insertTestUser,
  getTestUserByEmail 
} from '../../utils/testDb.js';
import { 
  waitForService,
  generateTestJWT,
  checkServiceHealth,
  waitForAllServices
} from '../../utils/testHelpers.js';

const GRAPHQL_BASE_URL = process.env.GRAPHQL_GATEWAY_URL || 'http://localhost:4000';
const AUTH_BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

describe('Phase 1 Integration - Service Communication', () => {
  beforeAll(async () => {
    // Wait for all services to be ready
    await waitForAllServices([
      { url: `${GRAPHQL_BASE_URL}/health`, name: 'GraphQL Gateway' },
      { url: `${AUTH_BASE_URL}/health`, name: 'Auth Service' }
    ], 45000);
    
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('End-to-End User Registration Flow', () => {
    it('should complete full registration through GraphQL Gateway', async () => {
      const newUser = {
        email: 'integration.test@example.com',
        password: 'SecurePassword123!',
        role: 'USER'
      };

      // Step 1: Register through GraphQL Gateway
      const registerResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: `
            mutation RegisterUser($input: RegisterInput!) {
              register(input: $input) {
                success
                message
                user {
                  id
                  email
                  role
                }
                token
              }
            }
          `,
          variables: { input: newUser }
        })
        .expect(200);

      expect(registerResponse.body.data.register.success).toBe(true);
      expect(registerResponse.body.data.register.user.email).toBe(newUser.email);
      expect(registerResponse.body.data.register.token).toBeTruthy();

      const token = registerResponse.body.data.register.token;

      // Step 2: Verify user can use token for authenticated requests
      const meResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: `
            query Me {
              me {
                id
                email
                role
              }
            }
          `
        })
        .expect(200);

      expect(meResponse.body.data.me.email).toBe(newUser.email);
      expect(meResponse.body.data.me.role).toBe('USER');

      // Step 3: Verify user exists in Auth Service database
      const dbUser = await getTestUserByEmail(newUser.email);
      expect(dbUser).toBeTruthy();
      expect(dbUser.email).toBe(newUser.email);

      // Step 4: Verify direct Auth Service call works with same token
      const authMeResponse = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(authMeResponse.body.user.email).toBe(newUser.email);
    });
  });

  describe('End-to-End User Login Flow', () => {
    let testUser;

    beforeEach(async () => {
      // Pre-create user for login tests
      testUser = testUsers.validUser;
      await insertTestUser({
        email: testUser.email,
        password_hash: await require('bcrypt').hash(testUser.password, 10),
        role: testUser.role
      });
    });

    it('should complete full login through GraphQL Gateway', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      // Step 1: Login through GraphQL Gateway
      const loginResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: `
            mutation LoginUser($input: LoginInput!) {
              login(input: $input) {
                success
                message
                user {
                  id
                  email
                  role
                }
                token
              }
            }
          `,
          variables: { input: loginData }
        })
        .expect(200);

      expect(loginResponse.body.data.login.success).toBe(true);
      expect(loginResponse.body.data.login.user.email).toBe(testUser.email);
      expect(loginResponse.body.data.login.token).toBeTruthy();

      const token = loginResponse.body.data.login.token;

      // Step 2: Use token for GraphQL query
      const meResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: `
            query Me {
              me {
                email
                role
              }
            }
          `
        })
        .expect(200);

      expect(meResponse.body.data.me.email).toBe(testUser.email);

      // Step 3: Verify token works with Auth Service directly
      const authMeResponse = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(authMeResponse.body.user.email).toBe(testUser.email);
    });

    it('should handle login failures consistently across services', async () => {
      const invalidLogin = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      // Step 1: Attempt login through GraphQL
      const graphqlResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: `
            mutation LoginUser($input: LoginInput!) {
              login(input: $input) {
                success
                message
                user {
                  id
                }
                token
              }
            }
          `,
          variables: { input: invalidLogin }
        })
        .expect(200);

      expect(graphqlResponse.body.data.login.success).toBe(false);
      expect(graphqlResponse.body.data.login.token).toBeNull();

      // Step 2: Verify direct Auth Service gives same result
      const authResponse = await request(AUTH_BASE_URL)
        .post('/auth/login')
        .send(invalidLogin)
        .expect(401);

      expect(authResponse.body.success).toBe(false);
    });
  });

  describe('Service Health and Connectivity', () => {
    it('should verify all services are healthy', async () => {
      // Check GraphQL Gateway health
      const graphqlHealth = await request(GRAPHQL_BASE_URL)
        .get('/health')
        .expect(200);

      expect(graphqlHealth.body.status).toBe('ok');
      expect(graphqlHealth.body.service).toBe('graphql-gateway');

      // Check Auth Service health
      const authHealth = await request(AUTH_BASE_URL)
        .get('/health')
        .expect(200);

      expect(authHealth.body.status).toBe('ok');
      expect(authHealth.body.service).toBe('auth-service');
    });

    it('should handle Auth Service connectivity issues gracefully', async () => {
      // This test simulates what happens when GraphQL Gateway can't reach Auth Service
      // In a real scenario, we might temporarily stop the auth service
      
      const loginAttempt = {
        email: 'test@example.com',
        password: 'password'
      };

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: `
            mutation LoginUser($input: LoginInput!) {
              login(input: $input) {
                success
                message
              }
            }
          `,
          variables: { input: loginAttempt }
        })
        .expect(200);

      // Should handle gracefully (either succeed or fail gracefully, not crash)
      expect(response.body.data.login).toHaveProperty('success');
      expect(typeof response.body.data.login.success).toBe('boolean');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency between GraphQL and Auth Service', async () => {
      const userData = {
        email: 'consistency.test@example.com',
        password: 'TestPassword123!',
        role: 'ADMIN'
      };

      // Create user through GraphQL
      const registerResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: `
            mutation RegisterUser($input: RegisterInput!) {
              register(input: $input) {
                success
                user {
                  id
                  email
                  role
                }
                token
              }
            }
          `,
          variables: { input: userData }
        })
        .expect(200);

      expect(registerResponse.body.data.register.success).toBe(true);
      const token = registerResponse.body.data.register.token;

      // Query through GraphQL
      const graphqlMeResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: `
            query Me {
              me {
                email
                role
              }
            }
          `
        })
        .expect(200);

      // Query through Auth Service directly
      const authMeResponse = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Data should be consistent
      expect(graphqlMeResponse.body.data.me.email).toBe(authMeResponse.body.user.email);
      expect(graphqlMeResponse.body.data.me.role).toBe('ADMIN'); // GraphQL enum format
      expect(authMeResponse.body.user.role).toBe('admin'); // Auth service format
    });

    it('should handle concurrent operations correctly', async () => {
      const baseEmail = 'concurrent.test';
      const users = Array(5).fill().map((_, i) => ({
        email: `${baseEmail}${i}@example.com`,
        password: `Password${i}123!`,
        role: i % 2 === 0 ? 'USER' : 'ADMIN'
      }));

      // Register multiple users concurrently through GraphQL
      const registerPromises = users.map(user =>
        request(GRAPHQL_BASE_URL)
          .post('/graphql')
          .send({
            query: `
              mutation RegisterUser($input: RegisterInput!) {
                register(input: $input) {
                  success
                  user {
                    email
                    role
                  }
                  token
                }
              }
            `,
            variables: { input: user }
          })
      );

      const results = await Promise.all(registerPromises);
      
      // All registrations should succeed
      results.forEach((result, index) => {
        expect(result.status).toBe(200);
        expect(result.body.data.register.success).toBe(true);
        expect(result.body.data.register.user.email).toBe(users[index].email);
      });

      // Verify all users exist in database
      for (const user of users) {
        const dbUser = await getTestUserByEmail(user.email);
        expect(dbUser).toBeTruthy();
        expect(dbUser.email).toBe(user.email);
      }
    });
  });

  describe('Error Propagation', () => {
    it('should propagate Auth Service errors correctly through GraphQL', async () => {
      const invalidUser = {
        email: 'invalid-email-format',
        password: 'short',
        role: 'USER'
      };

      const graphqlResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: `
            mutation RegisterUser($input: RegisterInput!) {
              register(input: $input) {
                success
                message
                user {
                  id
                }
                token
              }
            }
          `,
          variables: { input: invalidUser }
        })
        .expect(200);

      expect(graphqlResponse.body.data.register.success).toBe(false);
      expect(graphqlResponse.body.data.register.message).toBeTruthy();
      expect(typeof graphqlResponse.body.data.register.message).toBe('string');

      // Compare with direct Auth Service error
      const authResponse = await request(AUTH_BASE_URL)
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(authResponse.body.success).toBe(false);
      
      // Both should indicate validation failure
      expect(graphqlResponse.body.data.register.message.toLowerCase()).toMatch(/email|password|validation/);
      expect(authResponse.body.message.toLowerCase()).toMatch(/email|password|validation/);
    });

    it('should handle network timeouts gracefully', async () => {
      // This would require mocking network issues, but we can test resilience
      const loginData = {
        email: 'timeout.test@example.com',
        password: 'password123'
      };

      const start = Date.now();
      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .timeout(10000) // 10 second timeout
        .send({
          query: `
            mutation LoginUser($input: LoginInput!) {
              login(input: $input) {
                success
                message
              }
            }
          `,
          variables: { input: loginData }
        })
        .expect(200);

      const duration = Date.now() - start;
      
      // Response should come back in reasonable time
      expect(duration).toBeLessThan(10000);
      expect(response.body.data.login).toHaveProperty('success');
    });
  });

  describe('Performance and Load', () => {
    it('should handle multiple simultaneous requests', async () => {
      const testUser = testUsers.validUser;
      await insertTestUser({
        email: testUser.email,
        password_hash: await require('bcrypt').hash(testUser.password, 10),
        role: testUser.role
      });

      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      // Create multiple concurrent login requests
      const promises = Array(10).fill().map(() =>
        request(GRAPHQL_BASE_URL)
          .post('/graphql')
          .send({
            query: `
              mutation LoginUser($input: LoginInput!) {
                login(input: $input) {
                  success
                  token
                }
              }
            `,
            variables: { input: loginData }
          })
      );

      const start = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      // All requests should complete successfully
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.data.login.success).toBe(true);
        expect(result.body.data.login.token).toBeTruthy();
      });

      // Should complete in reasonable time (adjust based on system performance)
      expect(duration).toBeLessThan(5000); // 5 seconds for 10 requests
    });

    it('should maintain performance under sequential load', async () => {
      const times = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        
        await request(GRAPHQL_BASE_URL)
          .get('/health')
          .expect(200);
          
        times.push(Date.now() - start);
      }

      // Each request should be consistently fast
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      expect(avgTime).toBeLessThan(1000); // Average under 1 second

      // No request should be significantly slower than others
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      expect(maxTime - minTime).toBeLessThan(2000); // Variance under 2 seconds
    });
  });
});