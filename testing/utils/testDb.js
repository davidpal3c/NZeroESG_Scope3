// Database testing utilities for consistent test environment setup
import { Pool } from 'pg';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

let testDbPool = null;

/**
 * Create and configure test database connection pool
 */
export async function createTestDbPool() {
  if (testDbPool) {
    return testDbPool;
  }

  testDbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5, // Limit connections for testing
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Test the connection
  try {
    const client = await testDbPool.connect();
    console.log('📊 Test database connection established');
    client.release();
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }

  return testDbPool;
}

/**
 * Setup test database schema and tables
 */
export async function setupTestDatabase() {
  const pool = await createTestDbPool();
  
  try {
    console.log('🔧 Setting up test database schema...');
    
    // Drop and recreate tables for clean state
    await pool.query(`
      DROP TABLE IF EXISTS user_sessions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
    `);

    // Create user role enum
    await pool.query(`
      CREATE TYPE user_role AS ENUM ('ADMIN', 'VENDOR', 'CUSTOMER');
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role user_role NOT NULL DEFAULT 'CUSTOMER',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user sessions table
    await pool.query(`
      CREATE TABLE user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
    `);

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_role ON users(role);
      CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX idx_sessions_token_hash ON user_sessions(token_hash);
      CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);
    `);

    console.log('✅ Test database schema setup completed');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

/**
 * Seed test database with initial data
 */
export async function seedTestDatabase() {
  const pool = await createTestDbPool();
  
  try {
    console.log('🌱 Seeding test database...');
    
    // Insert test users (passwords are hashed versions of fixture passwords)
    await pool.query(`
      INSERT INTO users (email, password_hash, role) VALUES
      ('test.user@nzeroesg.com', '$2b$04$rZ8Q8.QJ8QJ8QJ8QJ8QJ8.QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8', 'CUSTOMER'),
      ('admin@nzeroesg.com', '$2b$04$aZ8Q8.QJ8QJ8QJ8QJ8QJ8.QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8', 'ADMIN'),
      ('vendor@example.com', '$2b$04$vZ8Q8.QJ8QJ8QJ8QJ8QJ8.QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8', 'VENDOR')
    `);

    console.log('✅ Test database seeding completed');
  } catch (error) {
    console.error('❌ Test database seeding failed:', error);
    throw error;
  }
}

/**
 * Clean up test database - remove all test data
 */
export async function cleanupTestDatabase() {
  const pool = await createTestDbPool();
  
  try {
    console.log('🧹 Cleaning up test database...');
    
    // Delete in reverse order of dependencies
    await pool.query('DELETE FROM user_sessions');
    await pool.query('DELETE FROM users');
    
    // Reset sequences
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE user_sessions_id_seq RESTART WITH 1');
    
    console.log('✅ Test database cleanup completed');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
    throw error;
  }
}

/**
 * Completely tear down test database
 */
export async function teardownTestDatabase() {
  if (!testDbPool) {
    return;
  }
  
  try {
    console.log('💥 Tearing down test database...');
    
    // Drop all test tables
    await testDbPool.query(`
      DROP TABLE IF EXISTS user_sessions CASCADE;
      DROP TABLE IF EXISTS users CASCADE; 
      DROP TYPE IF EXISTS user_role CASCADE;
    `);
    
    console.log('✅ Test database teardown completed');
  } catch (error) {
    console.error('❌ Test database teardown failed:', error);
    throw error;
  } finally {
    // Close connection pool
    await testDbPool.end();
    testDbPool = null;
  }
}

/**
 * Execute raw SQL query for testing
 */
export async function executeQuery(query, params = []) {
  const pool = await createTestDbPool();
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('❌ Query execution failed:', error);
    throw error;
  }
}

/**
 * Insert test user and return the created user
 */
export async function insertTestUser(userData) {
  const pool = await createTestDbPool();
  
  try {
    const result = await pool.query(`
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id, email, role, is_active, created_at, updated_at
    `, [userData.email, userData.password_hash, userData.role]);
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Test user insertion failed:', error);
    throw error;
  }
}

/**
 * Get test user by email
 */
export async function getTestUserByEmail(email) {
  const pool = await createTestDbPool();
  
  try {
    const result = await pool.query(`
      SELECT id, email, password_hash, role, is_active, created_at, updated_at
      FROM users 
      WHERE email = $1
    `, [email]);
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Test user retrieval failed:', error);
    throw error;
  }
}

/**
 * Validate test environment
 */
export async function validateTestEnvironment() {
  try {
    console.log('🔍 Validating test environment...');
    
    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'AUTH_SERVICE_URL',
      'GRAPHQL_GATEWAY_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Test database connection
    const pool = await createTestDbPool();
    const result = await pool.query('SELECT NOW()');
    
    if (!result.rows[0]) {
      throw new Error('Database connection test failed');
    }
    
    console.log('✅ Test environment validation passed');
    return true;
  } catch (error) {
    console.error('❌ Test environment validation failed:', error);
    throw error;
  }
}