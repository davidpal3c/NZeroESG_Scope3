// GraphQL Gateway resolvers tests
import gql from 'graphql-tag';
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
  generateTestJWT 
} from '../../utils/testHelpers.js';

const GRAPHQL_BASE_URL = process.env.GRAPHQL_GATEWAY_URL || 'http://localhost:4000';
const AUTH_BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

describe('GraphQL Gateway - Resolvers', () => {
  beforeAll(async () => {
    await waitForService(`${GRAPHQL_BASE_URL}/health`, 30000);
    await waitForService(`${AUTH_BASE_URL}/health`, 30000);
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('Auth Resolvers', () => {
    describe('register mutation', () => {
      it('should register new user successfully', async () => {
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
          email: 'resolver.test@example.com',
          password: 'securePassword123!',
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
        expect(response.body.data.register.user.role).toBe('USER');
        expect(response.body.data.register.token).toBeTruthy();
        expect(response.body.data.register.message).toMatch(/success|created/i);

        // Verify JWT token is valid
        const decoded = jwt.verify(response.body.data.register.token, process.env.JWT_SECRET);
        expect(decoded.email).toBe(newUser.email);
        expect(decoded.role).toBe('user'); // Auth service returns lowercase
      });

      it('should handle validation errors', async () => {
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

        const invalidUser = {
          email: 'invalid-email',
          password: 'weak',
          role: 'USER'
        };

        const response = await request(GRAPHQL_BASE_URL)
          .post('/graphql')
          .send({
            query: registerMutation.loc.source.body,
            variables: { input: invalidUser }
          })
          .expect(200);

        expect(response.body.data.register.success).toBe(false);
        expect(response.body.data.register.message).toMatch(/email|password|validation/i);
        expect(response.body.data.register.user).toBeNull();
        expect(response.body.data.register.token).toBeNull();
      });

      it('should handle duplicate email registration', async () => {
        // First create a user
        const userData = testUsers.validUser;
        await insertTestUser({
          email: userData.email,
          password_hash: await require('bcrypt').hash(userData.password, 10),
          role: userData.role
        });

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

        const duplicateUser = {
          email: userData.email, // Same as existing user
          password: 'differentPassword123!',
          role: 'USER'
        };

        const response = await request(GRAPHQL_BASE_URL)
          .post('/graphql')
          .send({
            query: registerMutation.loc.source.body,
            variables: { input: duplicateUser }
          })
          .expect(200);

        expect(response.body.data.register.success).toBe(false);
        expect(response.body.data.register.message).toMatch(/email.*exists|duplicate/i);
        expect(response.body.data.register.user).toBeNull();
        expect(response.body.data.register.token).toBeNull();
      });

      it('should validate role enum values', async () => {
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

        const invalidRoleUser = {
          email: 'test@example.com',
          password: 'securePassword123!',
          role: 'INVALID_ROLE'
        };

        const response = await request(GRAPHQL_BASE_URL)
          .post('/graphql')
          .send({
            query: registerMutation.loc.source.body,
            variables: { input: invalidRoleUser }
          })
          .expect(200);

        // Should get GraphQL validation error for invalid enum value
        expect(response.body.errors).toBeInstanceOf(Array);
        expect(response.body.errors[0].message).toMatch(/enum|role|value/i);
      });
    });

    describe('login mutation', () => {
      let testUser;

      beforeEach(async () => {
        testUser = testUsers.validUser;
        await insertTestUser({
          email: testUser.email,
          password_hash: await require('bcrypt').hash(testUser.password, 10),
          role: testUser.role
        });
      });

      it('should login user with valid credentials', async () => {
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
        expect(response.body.data.login.user.role).toBe('USER'); // GraphQL enum value
        expect(response.body.data.login.token).toBeTruthy();
        expect(response.body.data.login.message).toMatch(/success|login/i);
      });

      it('should reject invalid credentials', async () => {
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
          email: testUser.email,
          password: 'wrongPassword'
        };

        const response = await request(GRAPHQL_BASE_URL)
          .post('/graphql')
          .send({
            query: loginMutation.loc.source.body,
            variables: { input: invalidLogin }
          })
          .expect(200);

        expect(response.body.data.login.success).toBe(false);
        expect(response.body.data.login.message).toMatch(/credentials|invalid|authentication/i);
        expect(response.body.data.login.user).toBeNull();
        expect(response.body.data.login.token).toBeNull();
      });

      it('should handle non-existent user', async () => {
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

        const nonExistentLogin = {
          email: 'nonexistent@example.com',
          password: 'somePassword'
        };

        const response = await request(GRAPHQL_BASE_URL)
          .post('/graphql')
          .send({
            query: loginMutation.loc.source.body,
            variables: { input: nonExistentLogin }
          })
          .expect(200);

        expect(response.body.data.login.success).toBe(false);
        expect(response.body.data.login.message).toMatch(/credentials|user.*found/i);
        expect(response.body.data.login.user).toBeNull();
        expect(response.body.data.login.token).toBeNull();
      });
    });

    describe('me query', () => {
      let testUser;
      let authToken;

      beforeEach(async () => {
        testUser = testUsers.validUser;
        await insertTestUser({
          email: testUser.email,
          password_hash: await require('bcrypt').hash(testUser.password, 10),
          role: testUser.role
        });

        const dbUser = await getTestUserByEmail(testUser.email);
        authToken = generateTestJWT({
          userId: dbUser.user_id,
          email: dbUser.email,
          role: dbUser.role
        });
      });

      it('should return current user with valid token', async () => {
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
        expect(response.body.data.me.role).toBe('USER');
        expect(response.body.data.me.id).toBeTruthy();
      });

      it('should reject query without authentication', async () => {
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
        expect(response.body.errors[0].message).toMatch(/unauthorized|authentication|token/i);
        expect(response.body.data.me).toBeNull();
      });

      it('should reject query with invalid token', async () => {
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
        expect(response.body.data.me).toBeNull();
      });

      it('should reject query with expired token', async () => {
        const expiredToken = jwt.sign(
          { userId: 1, email: testUser.email, role: testUser.role },
          process.env.JWT_SECRET,
          { expiresIn: '-1h' }
        );

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
          .set('Authorization', `Bearer ${expiredToken}`)
          .send({
            query: meQuery.loc.source.body
          })
          .expect(200);

        expect(response.body.errors).toBeInstanceOf(Array);
        expect(response.body.errors[0].message).toMatch(/expired|unauthorized|token/i);
        expect(response.body.data.me).toBeNull();
      });
    });
  });

  describe('Future Service Resolvers Preparation', () => {
    let authToken;

    beforeEach(async () => {
      const testUser = testUsers.validUser;
      await insertTestUser({
        email: testUser.email,
        password_hash: await require('bcrypt').hash(testUser.password, 10),
        role: testUser.role
      });

      const dbUser = await getTestUserByEmail(testUser.email);
      authToken = generateTestJWT({
        userId: dbUser.user_id,
        email: dbUser.email,
        role: dbUser.role
      });
    });

    it('should prepare for vendor queries', async () => {
      // This test documents the expected vendor query structure for Phase 2
      const vendorQuery = gql`
        query GetVendors {
          vendors {
            id
            name
            category
            sustainabilityScore
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: vendorQuery.loc.source.body
        })
        .expect(200);

      // Should get a field error since vendors resolver isn't implemented yet
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/field.*vendors.*query/i);
    });

    it('should prepare for AI service queries', async () => {
      // This test documents the expected AI query structure for Phase 3
      const aiQuery = gql`
        query GetCarbonFootprint($input: CarbonFootprintInput!) {
          carbonFootprint(input: $input) {
            totalEmissions
            breakdown {
              category
              emissions
              unit
            }
            recommendations
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: aiQuery.loc.source.body,
          variables: {
            input: {
              activityType: 'TRANSPORT',
              distance: 100,
              transportMode: 'CAR'
            }
          }
        })
        .expect(200);

      // Should get a field error since carbonFootprint resolver isn't implemented yet
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].message).toMatch(/field.*carbonFootprint.*query/i);
    });
  });

  describe('Type Transformation', () => {
    it('should transform auth service role to GraphQL enum', async () => {
      // Test that role transformation works correctly
      const adminUser = testUsers.adminUser;
      await insertTestUser({
        email: adminUser.email,
        password_hash: await require('bcrypt').hash(adminUser.password, 10),
        role: adminUser.role // 'admin' in database
      });

      const loginMutation = gql`
        mutation LoginUser($input: LoginInput!) {
          login(input: $input) {
            success
            user {
              role
            }
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: loginMutation.loc.source.body,
          variables: { 
            input: { 
              email: adminUser.email, 
              password: adminUser.password 
            } 
          }
        })
        .expect(200);

      expect(response.body.data.login.success).toBe(true);
      expect(response.body.data.login.user.role).toBe('ADMIN'); // GraphQL enum format
    });

    it('should handle ID transformation', async () => {
      const testUser = testUsers.validUser;
      await insertTestUser({
        email: testUser.email,
        password_hash: await require('bcrypt').hash(testUser.password, 10),
        role: testUser.role
      });

      const dbUser = await getTestUserByEmail(testUser.email);
      const authToken = generateTestJWT({
        userId: dbUser.user_id,
        email: dbUser.email,
        role: dbUser.role
      });

      const meQuery = gql`
        query Me {
          me {
            id
            email
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

      expect(response.body.data.me.id).toBeTruthy();
      expect(typeof response.body.data.me.id).toBe('string');
      expect(response.body.data.me.email).toBe(testUser.email);
    });
  });

  describe('Error Propagation', () => {
    it('should propagate auth service errors correctly', async () => {
      // Test that auth service errors are properly formatted for GraphQL
      const loginMutation = gql`
        mutation LoginUser($input: LoginInput!) {
          login(input: $input) {
            success
            message
          }
        }
      `;

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: loginMutation.loc.source.body,
          variables: { 
            input: { 
              email: 'invalid-email-format', 
              password: 'somepassword' 
            } 
          }
        })
        .expect(200);

      expect(response.body.data.login.success).toBe(false);
      expect(response.body.data.login.message).toBeTruthy();
      expect(typeof response.body.data.login.message).toBe('string');
    });
  });
});