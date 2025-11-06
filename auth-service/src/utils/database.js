const { Pool } = require('pg');

let pool = null;

const connectDB = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // maximum number of clients in the pool
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
      connectionTimeoutMillis: 2000, // how long to wait for a connection
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    console.log('✅ PostgreSQL connected successfully');
    
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB() first.');
  }
  return pool;
};

const closeDB = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database connection closed');
  }
};

module.exports = {
  connectDB,
  getPool,
  closeDB
};