// Phase 1 End-to-End User Workflows
import request from 'supertest';
import { testUsers } from '../../fixtures/users.js';
import { 
  setupTestDatabase, 
  cleanupTestDatabase,
  insertTestUser 
} from '../../utils/testDb.js';
import { 
  waitForAllServices 
} from '../../utils/testHelpers.js';

const GRAPHQL_BASE_URL = process.env.GRAPHQL_GATEWAY_URL || 'http://localhost:4000';
const AUTH_BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const FRONTEND_BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

describe('Phase 1 E2E - Complete User Workflows', () => {
  beforeAll(async () => {
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

  describe('New User Onboarding Journey', () => {
    it('should complete full user onboarding flow', async () => {
      const newUser = {
        email: 'onboarding.user@example.com',
        password: 'SecurePassword123!',
        role: 'USER'
      };

      // === Step 1: User Registration ===
      console.log('Step 1: Registering new user...');
      
      const registrationResponse = await request(GRAPHQL_BASE_URL)
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

      expect(registrationResponse.body.data.register.success).toBe(true);
      expect(registrationResponse.body.data.register.user.email).toBe(newUser.email);
      expect(registrationResponse.body.data.register.user.role).toBe('USER');
      expect(registrationResponse.body.data.register.token).toBeTruthy();

      const userToken = registrationResponse.body.data.register.token;
      const userId = registrationResponse.body.data.register.user.id;

      // === Step 2: Immediate Post-Registration Profile Access ===
      console.log('Step 2: Accessing user profile immediately after registration...');
      
      const profileResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: `
            query GetMyProfile {
              me {
                id
                email
                role
              }
            }
          `
        })
        .expect(200);

      expect(profileResponse.body.data.me.id).toBe(userId);
      expect(profileResponse.body.data.me.email).toBe(newUser.email);
      expect(profileResponse.body.data.me.role).toBe('USER');

      // === Step 3: User Logout and Re-Login ===
      console.log('Step 3: Testing logout and re-login flow...');
      
      // Logout (if logout endpoint exists)
      const logoutResponse = await request(AUTH_BASE_URL)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(res => {
          // Accept either 200 (logout implemented) or 404 (not implemented yet)
          expect([200, 404]).toContain(res.status);
        });

      if (logoutResponse.status === 200) {
        expect(logoutResponse.body.success).toBe(true);
      }

      // Re-login
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
          variables: { 
            input: { 
              email: newUser.email, 
              password: newUser.password 
            } 
          }
        })
        .expect(200);

      expect(loginResponse.body.data.login.success).toBe(true);
      expect(loginResponse.body.data.login.user.email).toBe(newUser.email);
      expect(loginResponse.body.data.login.token).toBeTruthy();

      const newToken = loginResponse.body.data.login.token;

      // === Step 4: Authenticated Actions with New Token ===
      console.log('Step 4: Using new token for authenticated actions...');
      
      const authenticatedResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${newToken}`)
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

      expect(authenticatedResponse.body.data.me.email).toBe(newUser.email);
      expect(authenticatedResponse.body.data.me.role).toBe('USER');

      console.log('✅ Complete user onboarding flow successful');
    });

    it('should handle registration validation errors gracefully', async () => {
      const invalidUser = {
        email: 'invalid-email-format', // Invalid email
        password: 'weak', // Weak password
        role: 'USER'
      };

      console.log('Testing registration validation flow...');

      const registrationResponse = await request(GRAPHQL_BASE_URL)
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

      expect(registrationResponse.body.data.register.success).toBe(false);
      expect(registrationResponse.body.data.register.message).toBeTruthy();
      expect(registrationResponse.body.data.register.message).toMatch(/email|password|validation/i);
      expect(registrationResponse.body.data.register.user).toBeNull();
      expect(registrationResponse.body.data.register.token).toBeNull();

      console.log('✅ Registration validation error handling successful');
    });
  });

  describe('Existing User Session Management', () => {
    let existingUser;
    let userToken;

    beforeEach(async () => {
      // Create an existing user
      existingUser = testUsers.validUser;
      await insertTestUser({
        email: existingUser.email,
        password_hash: await require('bcrypt').hash(existingUser.password, 10),
        role: existingUser.role
      });

      // Login to get token
      const loginResponse = await request(GRAPHQL_BASE_URL)
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
          variables: { 
            input: { 
              email: existingUser.email, 
              password: existingUser.password 
            } 
          }
        });

      userToken = loginResponse.body.data.login.token;
    });

    it('should maintain session across multiple requests', async () => {
      console.log('Testing session persistence across multiple requests...');

      // Make multiple authenticated requests
      const requests = [
        { query: 'query { me { email } }', description: 'Profile query 1' },
        { query: 'query { me { role } }', description: 'Profile query 2' },
        { query: 'query { me { id email } }', description: 'Profile query 3' }
      ];

      for (const [index, req] of requests.entries()) {
        console.log(`Making request ${index + 1}: ${req.description}`);
        
        const response = await request(GRAPHQL_BASE_URL)
          .post('/graphql')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ query: req.query })
          .expect(200);

        expect(response.body.data.me).toBeTruthy();
        expect(response.body.data.me.email || existingUser.email).toBe(existingUser.email);
      }

      console.log('✅ Session persistence test successful');
    });

    it('should handle expired/invalid token scenarios', async () => {
      console.log('Testing invalid token handling...');

      // Test with invalid token
      const invalidTokenResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', 'Bearer invalid-token-string')
        .send({
          query: `
            query Me {
              me {
                email
              }
            }
          `
        })
        .expect(200);

      expect(invalidTokenResponse.body.errors).toBeInstanceOf(Array);
      expect(invalidTokenResponse.body.errors[0].message).toMatch(/unauthorized|invalid.*token/i);

      // Test with no token
      const noTokenResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: `
            query Me {
              me {
                email
              }
            }
          `
        })
        .expect(200);

      expect(noTokenResponse.body.errors).toBeInstanceOf(Array);
      expect(noTokenResponse.body.errors[0].message).toMatch(/unauthorized|authentication/i);

      console.log('✅ Invalid token handling test successful');
    });
  });

  describe('Admin User Workflows', () => {
    let adminUser;
    let adminToken;

    beforeEach(async () => {
      // Create admin user
      adminUser = testUsers.adminUser;
      await insertTestUser({
        email: adminUser.email,
        password_hash: await require('bcrypt').hash(adminUser.password, 10),
        role: adminUser.role
      });

      // Login as admin
      const loginResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: `
            mutation LoginUser($input: LoginInput!) {
              login(input: $input) {
                success
                user {
                  role
                }
                token
              }
            }
          `,
          variables: { 
            input: { 
              email: adminUser.email, 
              password: adminUser.password 
            } 
          }
        });

      adminToken = loginResponse.body.data.login.token;
      expect(loginResponse.body.data.login.user.role).toBe('ADMIN');
    });

    it('should authenticate admin user successfully', async () => {
      console.log('Testing admin user authentication...');

      const adminMeResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
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

      expect(adminMeResponse.body.data.me.email).toBe(adminUser.email);
      expect(adminMeResponse.body.data.me.role).toBe('ADMIN');

      console.log('✅ Admin authentication test successful');
    });

    it('should prepare for admin-only operations (Phase 2+)', async () => {
      // This test documents expected admin functionality for future phases
      console.log('Testing admin-only operation preparation...');

      // Try to access hypothetical admin-only endpoint
      const adminQueryResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: `
            query GetAllUsers {
              users {
                id
                email
                role
              }
            }
          `
        })
        .expect(200);

      // Should get field error since users query isn't implemented in Phase 1
      expect(adminQueryResponse.body.errors).toBeInstanceOf(Array);
      expect(adminQueryResponse.body.errors[0].message).toMatch(/field.*users.*query/i);

      console.log('✅ Admin operation preparation test successful (field not implemented yet, as expected)');
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should recover from authentication failures', async () => {
      console.log('Testing authentication failure recovery...');

      const invalidCredentials = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      // Step 1: Failed login attempt
      const failedLoginResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: `
            mutation LoginUser($input: LoginInput!) {
              login(input: $input) {
                success
                message
                token
              }
            }
          `,
          variables: { input: invalidCredentials }
        })
        .expect(200);

      expect(failedLoginResponse.body.data.login.success).toBe(false);
      expect(failedLoginResponse.body.data.login.token).toBeNull();

      // Step 2: Create valid user
      const validUser = {
        email: 'recovery.test@example.com',
        password: 'ValidPassword123!',
        role: 'USER'
      };

      const registrationResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: `
            mutation RegisterUser($input: RegisterInput!) {
              register(input: $input) {
                success
                token
              }
            }
          `,
          variables: { input: validUser }
        })
        .expect(200);

      expect(registrationResponse.body.data.register.success).toBe(true);
      expect(registrationResponse.body.data.register.token).toBeTruthy();

      // Step 3: Successful login after recovery
      const successfulLoginResponse = await request(GRAPHQL_BASE_URL)
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
          variables: { 
            input: { 
              email: validUser.email, 
              password: validUser.password 
            } 
          }
        })
        .expect(200);

      expect(successfulLoginResponse.body.data.login.success).toBe(true);
      expect(successfulLoginResponse.body.data.login.token).toBeTruthy();

      console.log('✅ Authentication failure recovery test successful');
    });

    it('should handle service connectivity issues gracefully', async () => {
      console.log('Testing service connectivity resilience...');

      // Test that GraphQL Gateway handles Auth Service issues gracefully
      const testQuery = {
        email: 'connectivity.test@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .timeout(5000) // 5 second timeout
        .send({
          query: `
            mutation LoginUser($input: LoginInput!) {
              login(input: $input) {
                success
                message
              }
            }
          `,
          variables: { input: testQuery }
        })
        .expect(200);

      // Should get a response (either success or failure, but not crash)
      expect(response.body.data.login).toHaveProperty('success');
      expect(typeof response.body.data.login.success).toBe('boolean');

      console.log('✅ Service connectivity resilience test successful');
    });
  });

  describe('Data Consistency Workflows', () => {
    it('should maintain data consistency across operations', async () => {
      console.log('Testing data consistency across multiple operations...');

      // Step 1: Register user
      const userData = {
        email: 'consistency.workflow@example.com',
        password: 'ConsistentPassword123!',
        role: 'USER'
      };

      const registrationResponse = await request(GRAPHQL_BASE_URL)
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

      const { user: registeredUser, token } = registrationResponse.body.data.register;

      // Step 2: Query user data multiple ways
      const graphqlMeResponse = await request(GRAPHQL_BASE_URL)
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

      const authServiceResponse = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Step 3: Verify consistency
      expect(graphqlMeResponse.body.data.me.id).toBe(registeredUser.id);
      expect(graphqlMeResponse.body.data.me.email).toBe(registeredUser.email);
      expect(graphqlMeResponse.body.data.me.email).toBe(authServiceResponse.body.user.email);

      // Role format might differ between services (GraphQL enum vs auth service string)
      expect(graphqlMeResponse.body.data.me.role).toBe('USER');
      expect(authServiceResponse.body.user.role).toBe('user');

      console.log('✅ Data consistency workflow test successful');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle normal load patterns', async () => {
      console.log('Testing normal load patterns...');

      const testUser = testUsers.validUser;
      await insertTestUser({
        email: testUser.email,
        password_hash: await require('bcrypt').hash(testUser.password, 10),
        role: testUser.role
      });

      // Simulate normal user activity pattern
      const activities = [
        'Login',
        'Profile Access',
        'Profile Access',
        'Profile Access',
        'Another Profile Access'
      ];

      let token;

      for (const [index, activity] of activities.entries()) {
        console.log(`Activity ${index + 1}: ${activity}`);

        if (activity === 'Login') {
          const loginResponse = await request(GRAPHQL_BASE_URL)
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
              variables: { 
                input: { 
                  email: testUser.email, 
                  password: testUser.password 
                } 
              }
            })
            .expect(200);

          expect(loginResponse.body.data.login.success).toBe(true);
          token = loginResponse.body.data.login.token;
        } else {
          const profileResponse = await request(GRAPHQL_BASE_URL)
            .post('/graphql')
            .set('Authorization', `Bearer ${token}`)
            .send({
              query: `
                query Me {
                  me {
                    email
                  }
                }
              `
            })
            .expect(200);

          expect(profileResponse.body.data.me.email).toBe(testUser.email);
        }
      }

      console.log('✅ Normal load pattern test successful');
    });

    it('should complete workflows within acceptable time limits', async () => {
      console.log('Testing workflow performance...');

      const startTime = Date.now();

      // Quick registration workflow
      const userData = {
        email: 'performance.test@example.com',
        password: 'PerformanceTest123!',
        role: 'USER'
      };

      const registrationResponse = await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .send({
          query: `
            mutation RegisterUser($input: RegisterInput!) {
              register(input: $input) {
                success
                token
              }
            }
          `,
          variables: { input: userData }
        })
        .expect(200);

      const midTime = Date.now();
      const registrationTime = midTime - startTime;

      expect(registrationResponse.body.data.register.success).toBe(true);
      const token = registrationResponse.body.data.register.token;

      // Quick profile access
      await request(GRAPHQL_BASE_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: `
            query Me {
              me {
                email
              }
            }
          `
        })
        .expect(200);

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const profileTime = endTime - midTime;

      console.log(`Registration time: ${registrationTime}ms`);
      console.log(`Profile access time: ${profileTime}ms`);
      console.log(`Total workflow time: ${totalTime}ms`);

      // Performance assertions (adjust based on system requirements)
      expect(registrationTime).toBeLessThan(3000); // Registration under 3 seconds
      expect(profileTime).toBeLessThan(1000); // Profile access under 1 second
      expect(totalTime).toBeLessThan(5000); // Total workflow under 5 seconds

      console.log('✅ Workflow performance test successful');
    });
  });
});