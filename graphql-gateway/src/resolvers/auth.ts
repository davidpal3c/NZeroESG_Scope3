import axios from 'axios';

export const authResolvers = {
  Query: {
    me: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      return context.user;
    },

    users: async (parent: any, args: any, context: any) => {
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
    register: async (parent: any, args: any, context: any) => {
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
          token: response.data.token,
          success: true,
          message: 'Registration successful'
        };
      } catch (error: any) {
        console.error('Registration error:', error);
        return {
          user: null,
          token: null,
          success: false,
          message: error.response?.data?.message || 'Registration failed'
        };
      }
    },

    login: async (parent: any, args: any, context: any) => {
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
          token: response.data.token,
          success: true,
          message: 'Login successful'
        };
      } catch (error: any) {
        console.error('Login error:', error);
        return {
          user: null,
          token: null,
          success: false,
          message: error.response?.data?.message || 'Invalid credentials'
        };
      }
    },

    logout: async (parent: any, args: any, context: any) => {
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

        return {
          success: true,
          message: 'Logout successful'
        };
      } catch (error: any) {
        console.error('Logout error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Logout failed'
        };
      }
    },

    updateProfile: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      try {
        const response = await axios.put(
          `${context.dataSources.authService}/auth/profile`,
          args.input,
          {
            headers: {
              Authorization: `Bearer ${context.req.headers.authorization?.replace('Bearer ', '')}`
            }
          }
        );

        return {
          user: response.data.user,
          success: true,
          message: 'Profile updated successfully'
        };
      } catch (error: any) {
        console.error('Profile update error:', error);
        return {
          user: context.user,
          success: false,
          message: error.response?.data?.message || 'Profile update failed'
        };
      }
    },

    changePassword: async (parent: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      try {
        await axios.post(
          `${context.dataSources.authService}/auth/change-password`,
          {
            currentPassword: args.input.currentPassword,
            newPassword: args.input.newPassword
          },
          {
            headers: {
              Authorization: `Bearer ${context.req.headers.authorization?.replace('Bearer ', '')}`
            }
          }
        );

        return {
          success: true,
          message: 'Password changed successfully'
        };
      } catch (error: any) {
        console.error('Password change error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Password change failed'
        };
      }
    }
  }
};