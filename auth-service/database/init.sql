-- NZeroESG Auth Database Schema
-- PostgreSQL Database Initialization Script

-- Create database extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('admin', 'vendor', 'customer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User sessions table for refresh token management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Roles table for Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- User roles junction table (for multiple roles per user if needed)
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    UNIQUE(user_id, role_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
    ('admin', 'System administrator with full access', ARRAY['*']),
    ('vendor', 'Vendor user with supplier management access', ARRAY['vendor:read', 'vendor:write', 'compliance:read']),
    ('customer', 'Customer user with basic access', ARRAY['vendor:read', 'emissions:calculate'])
ON CONFLICT (name) DO NOTHING;

-- Create a default admin user (password: 'admin123' - CHANGE IN PRODUCTION!)
-- Password hash for 'admin123' using bcrypt with 12 rounds
INSERT INTO users (id, email, password_hash, role, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@nzeroesg.com', '$2a$12$rHwHGDXqWQJUgYYdqRX7BeWLDjJWS0pEyNRD5YxCYs.ySRqJfYh9K', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Create a test vendor user (password: 'vendor123' - FOR TESTING ONLY!)
-- Password hash for 'vendor123' using bcrypt with 12 rounds  
INSERT INTO users (id, email, password_hash, role, is_active) VALUES
    ('00000000-0000-0000-0000-000000000002', 'vendor@nzeroesg.com', '$2a$12$5YzDx.ZJxXzYk5uyqx9TduCHfXjP/xvfT6K3QJCe4QF5K8yKgYhOO', 'vendor', true)
ON CONFLICT (email) DO NOTHING;

-- Create a test customer user (password: 'customer123' - FOR TESTING ONLY!)
-- Password hash for 'customer123' using bcrypt with 12 rounds
INSERT INTO users (id, email, password_hash, role, is_active) VALUES
    ('00000000-0000-0000-0000-000000000003', 'customer@nzeroesg.com', '$2a$12$JZJxKq3k9fXpHGx.QY/n3OaWO2vxP5TpJQ7GF0QG7cJgKHzG5Yy3u', 'customer', true)
ON CONFLICT (email) DO NOTHING;