const axios = require('axios');

const authResolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      return context.user;
    },

    users: async (parent, args, context) => {
      // Only admins can list users
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Insufficient permissions');
      }

      try {
        const response = await axios.get(
          `${context.dataSources.authService}/auth/users`,
          {
            headers: {
              Authorization: `Bearer ${context.req.headers.authorization?.replace('Bearer ', '')}`
            }
          }
        );
        
        return response.data.users || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
      }
    },
  },

  Mutation: {
    register: async (parent, args, context) => {
      try {
        const response = await axios.post(
          `${context.dataSources.authService}/auth/register`,
          {
            email: args.input.email,
            password: args.input.password,
            role: args.input.role
          }
        );

        return {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresIn: response.data.expiresIn
        };
      } catch (error) {
        console.error('Registration error:', error);
        
        if (error.response?.status === 409) {
          throw new Error('User with this email already exists');
        }
        
        throw new Error('Registration failed');
      }
    },

    login: async (parent, args, context) => {
      try {
        const response = await axios.post(
          `${context.dataSources.authService}/auth/login`,
          {
            email: args.input.email,
            password: args.input.password
          }
        );

        return {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresIn: response.data.expiresIn
        };
      } catch (error) {
        console.error('Login error:', error);
        
        if (error.response?.status === 401) {
          throw new Error('Invalid email or password');
        }
        
        throw new Error('Login failed');
      }
    },

    refreshToken: async (parent, args, context) => {
      try {
        const response = await axios.post(
          `${context.dataSources.authService}/auth/refresh`,
          {
            refreshToken: args.refreshToken
          }
        );

        return {
          user: context.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresIn: response.data.expiresIn
        };
      } catch (error) {
        console.error('Token refresh error:', error);
        throw new Error('Failed to refresh token');
      }
    },

    logout: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      try {
        await axios.post(
          `${context.dataSources.authService}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${context.req.headers.authorization?.replace('Bearer ', '')}`
            }
          }
        );

        return true;
      } catch (error) {
        console.error('Logout error:', error);
        // Even if logout fails on the auth service, we can still return true
        // as the client should remove the token
        return true;
      }
    },

    updateProfile: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      try {
        const updates = {};
        if (args.email) updates.email = args.email;
        if (args.password) updates.password = args.password;

        const response = await axios.put(
          `${context.dataSources.authService}/auth/profile`,
          updates,
          {
            headers: {
              Authorization: `Bearer ${context.req.headers.authorization?.replace('Bearer ', '')}`
            }
          }
        );

        return response.data.user;
      } catch (error) {
        console.error('Profile update error:', error);
        throw new Error('Failed to update profile');
      }
    },
  },
};

module.exports = { authResolvers };