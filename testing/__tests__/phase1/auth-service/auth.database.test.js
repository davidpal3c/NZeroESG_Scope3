// Auth Service database integration tests
import bcrypt from 'bcrypt';
import { testUsers } from '../../fixtures/users.js';
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  insertTestUser,
  getTestUserByEmail,
  getAllTestUsers,
  deleteTestUser,
  updateTestUser,
  query
} from '../../utils/testDb.js';

describe('Auth Service - Database Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('User Creation', () => {
    it('should create user with hashed password', async () => {
      const userData = testUsers.validUser;
      const hashedPassword = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
      
      const userId = await insertTestUser({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role
      });

      expect(userId).toBeTruthy();
      expect(typeof userId).toBe('number');

      const dbUser = await getTestUserByEmail(userData.email);
      expect(dbUser.user_id).toBe(userId);
      expect(dbUser.email).toBe(userData.email);
      expect(dbUser.role).toBe(userData.role);
      expect(dbUser.password_hash).toBe(hashedPassword);
      expect(dbUser.created_at).toBeInstanceOf(Date);
      expect(dbUser.updated_at).toBeInstanceOf(Date);
    });

    it('should enforce unique email constraint', async () => {
      const userData = testUsers.validUser;
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Insert first user
      await insertTestUser({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role
      });

      // Attempt to insert duplicate email
      await expect(insertTestUser({
        email: userData.email, // Same email
        password_hash: hashedPassword,
        role: 'admin'
      })).rejects.toThrow(/unique|duplicate|email/i);
    });

    it('should validate email format in database', async () => {
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      await expect(insertTestUser({
        email: 'invalid-email', // Invalid format
        password_hash: hashedPassword,
        role: 'user'
      })).rejects.toThrow(/email|constraint|check/i);
    });

    it('should validate role enum values', async () => {
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      await expect(insertTestUser({
        email: 'test@example.com',
        password_hash: hashedPassword,
        role: 'invalid_role' // Not in enum
      })).rejects.toThrow(/role|constraint|check/i);
    });

    it('should require non-null email', async () => {
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      await expect(insertTestUser({
        email: null,
        password_hash: hashedPassword,
        role: 'user'
      })).rejects.toThrow(/null|email|constraint/i);
    });

    it('should require non-null password hash', async () => {
      await expect(insertTestUser({
        email: 'test@example.com',
        password_hash: null,
        role: 'user'
      })).rejects.toThrow(/null|password|constraint/i);
    });

    it('should set default role if not specified', async () => {
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      const userId = await insertTestUser({
        email: 'test@example.com',
        password_hash: hashedPassword
        // role omitted
      });

      const dbUser = await getTestUserByEmail('test@example.com');
      expect(dbUser.role).toBe('user'); // Default role
    });
  });

  describe('User Retrieval', () => {
    let testUser;

    beforeEach(async () => {
      const userData = testUsers.validUser;
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const userId = await insertTestUser({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role
      });

      testUser = { ...userData, userId, password_hash: hashedPassword };
    });

    it('should retrieve user by email', async () => {
      const dbUser = await getTestUserByEmail(testUser.email);
      
      expect(dbUser).toBeTruthy();
      expect(dbUser.user_id).toBe(testUser.userId);
      expect(dbUser.email).toBe(testUser.email);
      expect(dbUser.role).toBe(testUser.role);
      expect(dbUser.password_hash).toBe(testUser.password_hash);
    });

    it('should return null for non-existent email', async () => {
      const dbUser = await getTestUserByEmail('nonexistent@example.com');
      expect(dbUser).toBeNull();
    });

    it('should handle case-insensitive email lookup', async () => {
      const dbUser = await getTestUserByEmail(testUser.email.toUpperCase());
      expect(dbUser).toBeTruthy();
      expect(dbUser.email).toBe(testUser.email.toLowerCase());
    });

    it('should retrieve all users', async () => {
      // Insert additional users
      const adminData = testUsers.adminUser;
      const adminHashedPassword = await bcrypt.hash(adminData.password, 10);
      
      await insertTestUser({
        email: adminData.email,
        password_hash: adminHashedPassword,
        role: adminData.role
      });

      const allUsers = await getAllTestUsers();
      expect(allUsers).toHaveLength(2);
      
      const emails = allUsers.map(u => u.email);
      expect(emails).toContain(testUser.email);
      expect(emails).toContain(adminData.email);
    });
  });

  describe('User Updates', () => {
    let testUser;

    beforeEach(async () => {
      const userData = testUsers.validUser;
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const userId = await insertTestUser({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role
      });

      testUser = { ...userData, userId, password_hash: hashedPassword };
    });

    it('should update user role', async () => {
      await updateTestUser(testUser.userId, { role: 'admin' });
      
      const updatedUser = await getTestUserByEmail(testUser.email);
      expect(updatedUser.role).toBe('admin');
      expect(updatedUser.updated_at.getTime()).toBeGreaterThan(updatedUser.created_at.getTime());
    });

    it('should update user password hash', async () => {
      const newPassword = 'newpassword123';
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      
      await updateTestUser(testUser.userId, { password_hash: newHashedPassword });
      
      const updatedUser = await getTestUserByEmail(testUser.email);
      expect(updatedUser.password_hash).toBe(newHashedPassword);
      expect(updatedUser.password_hash).not.toBe(testUser.password_hash);
    });

    it('should not allow email updates to duplicate existing email', async () => {
      // Create another user
      const otherUserData = testUsers.adminUser;
      const otherHashedPassword = await bcrypt.hash(otherUserData.password, 10);
      
      await insertTestUser({
        email: otherUserData.email,
        password_hash: otherHashedPassword,
        role: otherUserData.role
      });

      // Try to update first user's email to match second user's email
      await expect(updateTestUser(testUser.userId, { 
        email: otherUserData.email 
      })).rejects.toThrow(/unique|duplicate|email/i);
    });

    it('should reject invalid role updates', async () => {
      await expect(updateTestUser(testUser.userId, { 
        role: 'invalid_role' 
      })).rejects.toThrow(/role|constraint|check/i);
    });
  });

  describe('User Deletion', () => {
    let testUser;

    beforeEach(async () => {
      const userData = testUsers.validUser;
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const userId = await insertTestUser({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role
      });

      testUser = { ...userData, userId };
    });

    it('should delete user by ID', async () => {
      const deletedCount = await deleteTestUser(testUser.userId);
      expect(deletedCount).toBe(1);
      
      const deletedUser = await getTestUserByEmail(testUser.email);
      expect(deletedUser).toBeNull();
    });

    it('should return 0 for non-existent user deletion', async () => {
      const deletedCount = await deleteTestUser(99999);
      expect(deletedCount).toBe(0);
    });
  });

  describe('Database Connection', () => {
    it('should execute raw queries successfully', async () => {
      const result = await query('SELECT NOW() as current_time');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].current_time).toBeInstanceOf(Date);
    });

    it('should handle parameterized queries', async () => {
      const testEmail = 'param-test@example.com';
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      // Insert using parameterized query
      await query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
        [testEmail, hashedPassword, 'user']
      );

      // Retrieve using parameterized query
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [testEmail]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe(testEmail);
    });

    it('should handle query errors gracefully', async () => {
      await expect(query('SELECT * FROM nonexistent_table'))
        .rejects.toThrow(/relation.*does not exist/i);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      // This test ensures that any foreign key constraints are maintained
      // For now, we just test that the users table exists and works correctly
      const userData = testUsers.validUser;
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const userId = await insertTestUser({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role
      });

      expect(userId).toBeTruthy();

      // Verify the user can be retrieved
      const dbUser = await getTestUserByEmail(userData.email);
      expect(dbUser).toBeTruthy();
      expect(dbUser.user_id).toBe(userId);
    });

    it('should handle concurrent user creation', async () => {
      // Test that multiple users can be created simultaneously
      const users = [
        { email: 'user1@example.com', password: 'pass1', role: 'user' },
        { email: 'user2@example.com', password: 'pass2', role: 'admin' },
        { email: 'user3@example.com', password: 'pass3', role: 'user' }
      ];

      const promises = users.map(async (userData, index) => {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        return insertTestUser({
          email: userData.email,
          password_hash: hashedPassword,
          role: userData.role
        });
      });

      const userIds = await Promise.all(promises);
      expect(userIds).toHaveLength(3);
      expect(userIds.every(id => typeof id === 'number')).toBe(true);

      // Verify all users were created
      const allUsers = await getAllTestUsers();
      expect(allUsers).toHaveLength(3);
    });
  });

  describe('Performance', () => {
    it('should handle email lookup efficiently', async () => {
      // Create multiple users
      const userCount = 100;
      const promises = Array(userCount).fill().map(async (_, index) => {
        const hashedPassword = await bcrypt.hash(`password${index}`, 10);
        return insertTestUser({
          email: `user${index}@example.com`,
          password_hash: hashedPassword,
          role: 'user'
        });
      });

      await Promise.all(promises);

      // Test lookup performance
      const startTime = Date.now();
      const user = await getTestUserByEmail('user50@example.com');
      const endTime = Date.now();

      expect(user).toBeTruthy();
      expect(user.email).toBe('user50@example.com');
      expect(endTime - startTime).toBeLessThan(100); // Should be fast (< 100ms)
    });
  });
});