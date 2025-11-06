// Test server utilities for starting/stopping services during tests
import axios from 'axios';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if a service is running on specified port
 */
export async function isServiceRunning(url, timeout = 5000) {
  try {
    const response = await axios.get(url, { 
      timeout,
      headers: { 'User-Agent': 'NZeroESG-Test-Suite' }
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for service to become available
 */
export async function waitForService(url, maxWaitTime = 30000, checkInterval = 1000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    if (await isServiceRunning(url)) {
      console.log(`✅ Service available at ${url}`);
      return true;
    }
    
    console.log(`⏳ Waiting for service at ${url}...`);
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  throw new Error(`Service at ${url} did not become available within ${maxWaitTime}ms`);
}

/**
 * Check health of all Phase 1 services
 */
export async function checkPhase1ServicesHealth() {
  const services = [
    { name: 'Auth Service', url: `${process.env.AUTH_SERVICE_URL}/health` },
    { name: 'GraphQL Gateway', url: `${process.env.GRAPHQL_GATEWAY_URL}/health` }
  ];
  
  const results = await Promise.allSettled(
    services.map(async service => {
      const isHealthy = await isServiceRunning(service.url);
      return { ...service, healthy: isHealthy };
    })
  );
  
  const healthResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return { ...services[index], healthy: false, error: result.reason };
    }
  });
  
  return healthResults;
}

/**
 * Start Docker Compose services for testing
 */
export async function startTestServices() {
  console.log('🐳 Starting test services with Docker Compose...');
  
  try {
    const { stdout, stderr } = await execAsync(
      'docker-compose -f docker-compose.phase1.yml up -d',
      { cwd: process.cwd() }
    );
    
    if (stderr && !stderr.includes('WARN')) {
      console.warn('Docker Compose warnings:', stderr);
    }
    
    console.log('✅ Docker services started');
    
    // Wait for services to be healthy
    await waitForService(`${process.env.AUTH_SERVICE_URL}/health`);
    await waitForService(`${process.env.GRAPHQL_GATEWAY_URL}/health`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to start test services:', error);
    throw error;
  }
}

/**
 * Stop Docker Compose services after testing
 */
export async function stopTestServices() {
  console.log('🛑 Stopping test services...');
  
  try {
    const { stdout, stderr } = await execAsync(
      'docker-compose -f docker-compose.phase1.yml down',
      { cwd: process.cwd() }
    );
    
    if (stderr && !stderr.includes('WARN')) {
      console.warn('Docker Compose warnings:', stderr);
    }
    
    console.log('✅ Docker services stopped');
    return true;
  } catch (error) {
    console.error('❌ Failed to stop test services:', error);
    throw error;
  }
}

/**
 * Make HTTP request with authentication token
 */
export async function makeAuthenticatedRequest(url, options = {}, token = null) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };
  
  try {
    const response = await axios(url, config);
    return response;
  } catch (error) {
    // Return error response for testing error handling
    return error.response || { status: 500, data: { error: error.message } };
  }
}

/**
 * Make GraphQL request
 */
export async function makeGraphQLRequest(query, variables = {}, token = null) {
  const url = `${process.env.GRAPHQL_GATEWAY_URL}/graphql`;
  
  const config = {
    method: 'POST',
    url,
    data: { query, variables },
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };
  
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    return error.response?.data || { errors: [{ message: error.message }] };
  }
}

/**
 * Login user and return JWT token for testing
 */
export async function loginTestUser(email, password) {
  try {
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/auth/login`,
      { email, password },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (response.data && response.data.token) {
      return response.data.token;
    } else {
      throw new Error('Login failed - no token received');
    }
  } catch (error) {
    console.error('Test user login failed:', error.message);
    throw error;
  }
}

/**
 * Register test user and return user data
 */
export async function registerTestUser(userData) {
  try {
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/auth/register`,
      userData,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    return response.data;
  } catch (error) {
    console.error('Test user registration failed:', error.message);
    throw error;
  }
}

/**
 * Clean up test artifacts (files, temporary data, etc.)
 */
export async function cleanupTestArtifacts() {
  console.log('🧹 Cleaning up test artifacts...');
  
  try {
    // Add cleanup logic for:
    // - Temporary files
    // - Test images
    // - Cache files
    // - Log files (if any)
    
    console.log('✅ Test artifacts cleanup completed');
  } catch (error) {
    console.error('❌ Test artifacts cleanup failed:', error);
    // Don't throw error as cleanup failures shouldn't fail tests
  }
}