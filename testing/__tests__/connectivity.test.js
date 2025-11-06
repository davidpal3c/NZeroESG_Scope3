// Simple connectivity test for Phase 1 services
const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const GRAPHQL_GATEWAY_URL = process.env.GRAPHQL_GATEWAY_URL || 'http://localhost:4000';

describe('Phase 1 Services Connectivity', () => {
  it('should connect to Auth Service', async () => {
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/health`);
      expect(response.status).toBe(200);
      console.log('✅ Auth Service is accessible');
    } catch (error) {
      console.log('❌ Auth Service connection failed:', error.message);
      throw error;
    }
  });

  it('should connect to GraphQL Gateway', async () => {
    try {
      const response = await axios.get(`${GRAPHQL_GATEWAY_URL}/health`);
      expect(response.status).toBe(200);
      console.log('✅ GraphQL Gateway is accessible');
    } catch (error) {
      console.log('❌ GraphQL Gateway connection failed:', error.message);
      throw error;
    }
  });

  it('should verify GraphQL endpoint', async () => {
    try {
      const response = await axios.post(`${GRAPHQL_GATEWAY_URL}/graphql`, {
        query: `
          query {
            __schema {
              types {
                name
              }
            }
          }
        `
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data.__schema).toBeDefined();
      console.log('✅ GraphQL introspection successful');
    } catch (error) {
      console.log('❌ GraphQL introspection failed:', error.message);
      throw error;
    }
  });
});