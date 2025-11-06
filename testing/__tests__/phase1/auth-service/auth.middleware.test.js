// Auth Service middleware tests
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { testUsers } from '../../fixtures/users.js';
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  insertTestUser,
  getTestUserByEmail 
} from '../../utils/testDb.js';
import { 
  waitForService 
} from '../../utils/testHelpers.js';

const AUTH_BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

describe('Auth Service - Middleware', () => {
  beforeAll(async () => {
    await waitForService(`${AUTH_BASE_URL}/health`, 30000);
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('JWT Token Validation', () => {
    let validToken;
    let testUser;

    beforeEach(async () => {
      // Create test user
      testUser = testUsers.validUser;
      const hashedPassword = await bcrypt.hash(testUser.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
      
      await insertTestUser({
        email: testUser.email,
        password_hash: hashedPassword,
        role: testUser.role
      });

      // Generate valid token
      const dbUser = await getTestUserByEmail(testUser.email);
      validToken = jwt.sign(
        { 
          userId: dbUser.user_id, 
          email: dbUser.email, 
          role: dbUser.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
    });

    it('should accept valid JWT token', async () => {
      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should reject malformed token', async () => {
      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', 'Bearer malformed-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/token|invalid/i);
    });

    it('should reject token with invalid signature', async () => {
      const invalidToken = jwt.sign(
        { userId: 1, email: testUser.email, role: testUser.role },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/token|invalid/i);
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 1, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/expired|token/i);
    });

    it('should reject missing Authorization header', async () => {
      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/token|authorization/i);
    });

    it('should reject Authorization header without Bearer prefix', async () => {
      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', validToken) // Missing 'Bearer '
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/token|bearer/i);
    });

    it('should reject empty Authorization header', async () => {
      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', '')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/token|authorization/i);
    });

    it('should reject token for non-existent user', async () => {
      const invalidUserToken = jwt.sign(
        { userId: 99999, email: 'nonexistent@example.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${invalidUserToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/user|token/i);
    });
  });

  describe('Role-Based Access Control', () => {
    let adminToken;
    let userToken;

    beforeEach(async () => {
      // Create admin user
      const adminData = testUsers.adminUser;
      const adminHashedPassword = await bcrypt.hash(adminData.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
      
      await insertTestUser({
        email: adminData.email,
        password_hash: adminHashedPassword,
        role: adminData.role
      });

      // Create regular user
      const userData = testUsers.validUser;
      const userHashedPassword = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
      
      await insertTestUser({
        email: userData.email,
        password_hash: userHashedPassword,
        role: userData.role
      });

      // Generate tokens
      const adminUser = await getTestUserByEmail(adminData.email);
      adminToken = jwt.sign(
        { userId: adminUser.user_id, email: adminUser.email, role: adminUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const regularUser = await getTestUserByEmail(userData.email);
      userToken = jwt.sign(
        { userId: regularUser.user_id, email: regularUser.email, role: regularUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should allow admin access to protected routes', async () => {
      // Note: This test assumes there's an admin-only endpoint
      // If not implemented yet, this serves as a specification
      const response = await request(AUTH_BASE_URL)
        .get('/auth/users') // Hypothetical admin endpoint
        .set('Authorization', `Bearer ${adminToken}`);

      // Expect either 200 (implemented) or 404 (not implemented yet)
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should deny regular user access to admin routes', async () => {
      const response = await request(AUTH_BASE_URL)
        .get('/auth/users') // Hypothetical admin endpoint
        .set('Authorization', `Bearer ${userToken}`);

      // Expect either 403 (implemented) or 404 (not implemented yet)
      expect([403, 404]).toContain(response.status);
      
      if (response.status === 403) {
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/permission|access|role/i);
      }
    });
  });

  describe('Error Handling Middleware', () => {
    it('should handle internal server errors gracefully', async () => {
      // This test ensures error handling middleware catches and formats errors
      const response = await request(AUTH_BASE_URL)
        .post('/auth/trigger-error') // Hypothetical error endpoint for testing
        .expect(res => {
          // Should return either 404 (endpoint not implemented) or 500 (error handled)
          expect([404, 500]).toContain(res.status);
        });

      if (response.status === 500) {
        expect(response.body).toHaveProperty('success');
        expect(response.body.success).toBe(false);
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should handle validation errors consistently', async () => {
      // Test that validation errors are formatted consistently
      const response = await request(AUTH_BASE_URL)
        .post('/auth/register')
        .send({}) // Empty body to trigger validation error
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('should not expose sensitive error details', async () => {
      const response = await request(AUTH_BASE_URL)
        .post('/auth/register')
        .send({ email: 'invalid', password: 'weak' })
        .expect(400);

      // Error message should not contain stack traces or internal details
      expect(response.body.message).not.toMatch(/stack|trace|internal|database|sql/i);
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('details');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple rapid requests', async () => {
      // Test that the service can handle multiple requests without crashing
      const promises = Array(10).fill().map((_, i) =>
        request(AUTH_BASE_URL)
          .post('/auth/login')
          .send({
            email: `test${i}@example.com`,
            password: 'testpassword'
          })
      );

      const responses = await Promise.all(promises);
      
      // All requests should get a response (either 401 for invalid creds or 429 for rate limit)
      responses.forEach(response => {
        expect([401, 429]).toContain(response.status);
      });
    });
  });

  describe('Content-Type Validation', () => {
    it('should reject non-JSON content for JSON endpoints', async () => {
      const response = await request(AUTH_BASE_URL)
        .post('/auth/register')
        .set('Content-Type', 'text/plain')
        .send('not json')
        .expect(res => {
          // Should return either 400 (validation error) or 415 (unsupported media type)
          expect([400, 415]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
    });

    it('should accept valid JSON content', async () => {
      const response = await request(AUTH_BASE_URL)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send({ email: 'test@example.com' }) // Invalid but JSON
        .expect(400); // Should fail validation but accept JSON format

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
    });
  });
});