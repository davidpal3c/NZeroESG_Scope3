// GraphQL Gateway server integration tests
import { ApolloServer } from '@apollo/server';
import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { testUsers } from '../../fixtures/users.js';
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  insertTestUser 
} from '../../utils/testDb.js';
import { 
  waitForService,
  checkGraphQLHealth,
  generateTestJWT 
} from '../../utils/testHelpers.js';

const GRAPHQL_BASE_URL = process.env.GRAPHQL_GATEWAY_URL || 'http://localhost:4000';
const AUTH_BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

describe('GraphQL Gateway - Server Integration', () => {
  beforeAll(async () => {
    // Ensure both services are running
    await waitForService(`${GRAPHQL_BASE_URL}/health`, 30000);
    await waitForService(`${AUTH_BASE_URL}/health`, 30000);
    
    // Setup clean database for auth service
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('Health and Schema', () => {
    it('should return health status', async () => {
      const response = await request(GRAPHQL_BASE_URL)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('service');
      expect(response.body.service).toBe('graphql-gateway');
    });

    it('should expose GraphQL playground in development', async () => {
      const response = await request(GRAPHQL_BASE_URL)
        .get('/graphql');

      // Should return either GraphQL Playground (200) or introspection query result
      expect([200, 400]).toContain(response.status);
    });

    it('should handle GraphQL schema introspection', async () => {
      const introspectionQuery = gql`
        query IntrospectionQuery {
          __schema {
            types {
              name
              kind
            }
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: introspectionQuery.loc.source.body
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('__schema');
      expect(response.body.data.__schema.types).toBeInstanceOf(Array);
      
      // Verify our custom types are present
      const typeNames = response.body.data.__schema.types.map(t => t.name);
      expect(typeNames).toContain('User');
      expect(typeNames).toContain('AuthPayload');
      expect(typeNames).toContain('Query');
      expect(typeNames).toContain('Mutation');
    });

    it('should reject malformed GraphQL queries', async () => {
      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: 'invalid graphql syntax {'
        })
        .expect(400);

      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/syntax|parse/i);
    });
  });

  describe('Authentication Flow', () => {
    let testUser;

    beforeEach(async () => {
      // Create test user in auth service
      testUser = testUsers.validUser;
      await insertTestUser({
        email: testUser.email,
        password_hash: await require('bcrypt').hash(testUser.password, 10),
        role: testUser.role
      });
    });

    it('should register user through GraphQL', async () => {
      const registerMutation = gql`
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
      `;

      const newUser = {
        email: 'newuser@example.com',
        password: 'securepassword123',
        role: 'USER'
      };

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: registerMutation.loc.source.body,
          variables: { input: newUser }
        })
        .expect(200);

      expect(response.body.data.register.success).toBe(true);
      expect(response.body.data.register.user.email).toBe(newUser.email);
      expect(response.body.data.register.user.role).toBe(newUser.role);
      expect(response.body.data.register.token).toBeTruthy();
      
      // Verify JWT token
      const decoded = jwt.verify(response.body.data.register.token, process.env.JWT_SECRET);
      expect(decoded.email).toBe(newUser.email);
    });

    it('should login user through GraphQL', async () => {
      const loginMutation = gql`
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
      `;

      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: loginMutation.loc.source.body,
          variables: { input: loginData }
        })
        .expect(200);

      expect(response.body.data.login.success).toBe(true);
      expect(response.body.data.login.user.email).toBe(testUser.email);
      expect(response.body.data.login.token).toBeTruthy();
    });

    it('should handle authentication errors gracefully', async () => {
      const loginMutation = gql`
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
      `;

      const invalidLogin = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: loginMutation.loc.source.body,
          variables: { input: invalidLogin }
        })
        .expect(200);

      expect(response.body.data.login.success).toBe(false);
      expect(response.body.data.login.message).toMatch(/credentials|authentication/i);
      expect(response.body.data.login.token).toBeFalsy();
    });
  });

  describe('Protected Queries', () => {
    let authToken;
    let testUser;

    beforeEach(async () => {
      // Create and authenticate test user
      testUser = testUsers.validUser;
      await insertTestUser({
        email: testUser.email,
        password_hash: await require('bcrypt').hash(testUser.password, 10),
        role: testUser.role
      });

      // Generate auth token
      authToken = generateTestJWT({
        email: testUser.email,
        role: testUser.role
      });
    });

    it('should query current user with valid token', async () => {
      const meQuery = gql`
        query Me {
          me {
            id
            email
            role
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: meQuery.loc.source.body
        })
        .expect(200);

      expect(response.body.data.me.email).toBe(testUser.email);
      expect(response.body.data.me.role).toBe(testUser.role.toUpperCase());
    });

    it('should reject protected queries without token', async () => {
      const meQuery = gql`
        query Me {
          me {
            id
            email
            role
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: meQuery.loc.source.body
        })
        .expect(200);

      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/unauthorized|authentication/i);
    });

    it('should reject protected queries with invalid token', async () => {
      const meQuery = gql`
        query Me {
          me {
            id
            email
            role
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          query: meQuery.loc.source.body
        })
        .expect(200);

      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/unauthorized|invalid.*token/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle service unavailability gracefully', async () => {
      // This test simulates what happens when auth service is down
      const loginMutation = gql`
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
      `;

      // If auth service is unavailable, we should get a graceful error
      // Note: This test might pass if auth service is actually running
      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: loginMutation.loc.source.body,
          variables: { 
            input: { 
              email: 'test@example.com', 
              password: 'password' 
            } 
          }
        })
        .expect(200);

      // Should either succeed (service available) or return graceful error
      if (response.body.errors) {
        expect(response.body.errors[0].message).not.toMatch(/ECONNREFUSED|network|timeout/i);
      }
    });

    it('should validate input types', async () => {
      const loginMutation = gql`
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
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: loginMutation.loc.source.body,
          variables: { 
            input: { 
              email: 123, // Wrong type
              password: true // Wrong type
            } 
          }
        })
        .expect(200);

      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/type|validation|input/i);
    });

    it('should handle missing required fields', async () => {
      const registerMutation = gql`
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
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: registerMutation.loc.source.body,
          variables: { 
            input: { 
              email: 'test@example.com'
              // Missing password and role
            } 
          }
        })
        .expect(200);

      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/required|field|input/i);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple concurrent requests', async () => {
      const healthQuery = gql`
        query Health {
          __typename
        }
      `;

      // Send multiple requests concurrently
      const promises = Array(20).fill().map(() =>
        request(GRAPHQL_BASE_URL)
          .post('/graphql')
          .send({
            query: healthQuery.loc.source.body
          })
      );

      const responses = await Promise.all(promises);
      
      // All requests should get a response (either 200 or 429)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });

      // At least some should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS and Headers', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(GRAPHQL_BASE_URL)
        .options('/graphql')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      expect([200, 204]).toContain(response.status);
      expect(response.headers['access-control-allow-origin']).toBeTruthy();
    });

    it('should accept requests with proper Content-Type', async () => {
      const simpleQuery = gql`
        query {
          __typename
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Content-Type', 'application/json')
        .send({
          query: simpleQuery.loc.source.body
        })
        .expect(200);

      expect(response.body.data.__typename).toBe('Query');
    });
  });
});