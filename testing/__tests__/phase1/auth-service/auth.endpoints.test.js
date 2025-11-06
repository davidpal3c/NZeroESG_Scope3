// Auth Service API endpoint tests
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { testUsers, userResponses } from '../../fixtures/users.js';
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  insertTestUser, 
  getTestUserByEmail 
} from '../../utils/testDb.js';
import { 
  waitForService,
  isServiceRunning 
} from '../../utils/testHelpers.js';

const AUTH_BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

describe('Auth Service - Registration Endpoints', () => {
  beforeAll(async () => {
    // Ensure auth service is running
    await waitForService(`${AUTH_BASE_URL}/health`, 30000);
    
    // Setup clean database
    await setupTestDatabase();
  });

  beforeEach(async () => {
    // Clean database before each test
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupTestDatabase();
  });

  describe('POST /auth/register', () => {
    it('should register new user with valid data', async () => {
      const userData = testUsers.validUser;
      
      const response = await request(AUTH_BASE_URL)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.user).not.toHaveProperty('password');

      // Verify JWT token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.email).toBe(userData.email);
      expect(decoded.role).toBe(userData.role);

      // Verify user exists in database
      const dbUser = await getTestUserByEmail(userData.email);
      expect(dbUser).toBeTruthy();
      expect(dbUser.email).toBe(userData.email);
    });

    it('should hash password securely', async () => {
      const userData = testUsers.validUser;
      
      await request(AUTH_BASE_URL)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const dbUser = await getTestUserByEmail(userData.email);
      
      // Password should be hashed, not plain text
      expect(dbUser.password_hash).not.toBe(userData.password);
      expect(dbUser.password_hash).toMatch(/^\$2b\$\d+\$/); // bcrypt format
      
      // Verify password hash is correct
      const isValidHash = await bcrypt.compare(userData.password, dbUser.password_hash);
      expect(isValidHash).toBe(true);
    });

    it('should reject duplicate email addresses', async () => {
      const userData = testUsers.validUser;
      
      // First registration should succeed
      await request(AUTH_BASE_URL)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(AUTH_BASE_URL)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should validate required fields', async () => {
      const invalidUser = testUsers.invalidUsers.missingEmail;
      
      const response = await request(AUTH_BASE_URL)
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should validate email format', async () => {
      const invalidUser = testUsers.invalidUsers.invalidEmail;
      
      const response = await request(AUTH_BASE_URL)
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should validate password strength', async () => {
      const invalidUser = testUsers.invalidUsers.weakPassword;
      
      const response = await request(AUTH_BASE_URL)
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    it('should validate user role', async () => {
      const invalidUser = testUsers.invalidUsers.invalidRole;
      
      const response = await request(AUTH_BASE_URL)
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('role');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      const userData = testUsers.validUser;
      const hashedPassword = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
      
      await insertTestUser({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role
      });
    });

    it('should authenticate user with valid credentials', async () => {
      const loginData = {
        email: testUsers.validUser.email,
        password: testUsers.validUser.password
      };
      
      const response = await request(AUTH_BASE_URL)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.success).toBe(true);

      // Verify JWT token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.email).toBe(loginData.email);
    });

    it('should reject invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: testUsers.validUser.password
      };
      
      const response = await request(AUTH_BASE_URL)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('credentials');
    });

    it('should reject invalid password', async () => {
      const loginData = {
        email: testUsers.validUser.email,
        password: 'wrongpassword'
      };
      
      const response = await request(AUTH_BASE_URL)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('credentials');
    });

    it('should validate required login fields', async () => {
      const response = await request(AUTH_BASE_URL)
        .post('/auth/login')
        .send({ email: testUsers.validUser.email }) // Missing password
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });
  });

  describe('GET /auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Create and login test user
      const userData = testUsers.validUser;
      const hashedPassword = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
      
      await insertTestUser({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role
      });

      // Login to get token
      const loginResponse = await request(AUTH_BASE_URL)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      authToken = loginResponse.body.token;
    });

    it('should return current user with valid token', async () => {
      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user.email).toBe(testUsers.validUser.email);
      expect(response.body.user.role).toBe(testUsers.validUser.role);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    it('should reject expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: 1, email: testUsers.validUser.email, role: testUsers.validUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      const response = await request(AUTH_BASE_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });
  });

  describe('POST /auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      // Create and login test user
      const userData = testUsers.validUser;
      const hashedPassword = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
      
      await insertTestUser({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role
      });

      const loginResponse = await request(AUTH_BASE_URL)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      authToken = loginResponse.body.token;
    });

    it('should logout user with valid token', async () => {
      const response = await request(AUTH_BASE_URL)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logout');
    });

    it('should reject logout without token', async () => {
      const response = await request(AUTH_BASE_URL)
        .post('/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(AUTH_BASE_URL)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('service');
      expect(response.body.service).toBe('auth-service');
    });
  });
});