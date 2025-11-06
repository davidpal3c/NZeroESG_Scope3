const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class User {
  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async create(userData) {
    try {
      const { id, email, passwordHash, role, isActive } = userData;
      const query = `
        INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [id, email, passwordHash, role, isActive]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async update(id, updates) {
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const query = `
        UPDATE users 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const values = [id, ...Object.values(updates)];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async list(filters = {}) {
    try {
      let query = 'SELECT id, email, role, is_active, created_at, updated_at FROM users';
      const values = [];
      const conditions = [];

      if (filters.role) {
        conditions.push(`role = $${values.length + 1}`);
        values.push(filters.role);
      }

      if (filters.isActive !== undefined) {
        conditions.push(`is_active = $${values.length + 1}`);
        values.push(filters.isActive);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }
}

class UserSession {
  static async create(sessionData) {
    try {
      const { userId, refreshToken, expiresAt } = sessionData;
      const id = uuidv4();
      
      const query = `
        INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [id, userId, refreshToken, expiresAt]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user session:', error);
      throw error;
    }
  }

  static async findByRefreshToken(refreshToken) {
    try {
      const query = 'SELECT * FROM user_sessions WHERE refresh_token = $1';
      const result = await pool.query(query, [refreshToken]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding session by refresh token:', error);
      throw error;
    }
  }

  static async updateRefreshToken(sessionId, newRefreshToken) {
    try {
      const query = `
        UPDATE user_sessions 
        SET refresh_token = $2, expires_at = $3
        WHERE id = $1
        RETURNING *
      `;
      
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const result = await pool.query(query, [sessionId, newRefreshToken, expiresAt]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating refresh token:', error);
      throw error;
    }
  }

  static async deleteByRefreshToken(refreshToken) {
    try {
      const query = 'DELETE FROM user_sessions WHERE refresh_token = $1 RETURNING *';
      const result = await pool.query(query, [refreshToken]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting session by refresh token:', error);
      throw error;
    }
  }

  static async deleteByUserId(userId) {
    try {
      const query = 'DELETE FROM user_sessions WHERE user_id = $1';
      const result = await pool.query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      console.error('Error deleting sessions by user ID:', error);
      throw error;
    }
  }

  static async deleteExpired() {
    try {
      const query = 'DELETE FROM user_sessions WHERE expires_at < NOW()';
      const result = await pool.query(query);
      return result.rowCount;
    } catch (error) {
      console.error('Error deleting expired sessions:', error);
      throw error;
    }
  }
}

module.exports = {
  User,
  UserSession,
  pool
};