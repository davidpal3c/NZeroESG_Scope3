import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { authResolvers } from './auth';
import { vendorResolvers } from './vendor';
import { aiResolvers } from './ai';

// Custom DateTime scalar
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date custom scalar type',
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    throw new Error('Value must be a Date or date string');
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new Error('Value must be a date string');
  },
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    throw new Error('Value must be a date string');
  },
});

export const resolvers = {
  // Custom scalars
  DateTime: DateTimeScalar,
  JSON: GraphQLJSON,

  // Root resolvers
  Query: {
    // Health check
    health: () => 'GraphQL Gateway is healthy!',
    
    // User queries
    me: authResolvers.Query.me,
    users: authResolvers.Query.users,
    
    // Vendor queries
    vendors: vendorResolvers.Query.vendors,
    vendor: vendorResolvers.Query.vendor,
    
    // AI queries
    chatMessage: aiResolvers.Query.chatMessage,
    chatHistory: aiResolvers.Query.chatHistory,
  },

  Mutation: {
    // Auth mutations
    register: authResolvers.Mutation.register,
    login: authResolvers.Mutation.login,
    logout: authResolvers.Mutation.logout,
    updateProfile: authResolvers.Mutation.updateProfile,
    changePassword: authResolvers.Mutation.changePassword,
    
    // Vendor mutations
    createVendor: vendorResolvers.Mutation.createVendor,
    updateVendor: vendorResolvers.Mutation.updateVendor,
    deleteVendor: vendorResolvers.Mutation.deleteVendor,
    
    // AI mutations
    sendChatMessage: aiResolvers.Mutation.sendChatMessage,
  },

  // Subscription resolvers (for future use)
  Subscription: {
    userStatusChanged: {
      // subscribe: () => pubsub.asyncIterator(['USER_STATUS_CHANGED']),
    },
    newVendorAdded: {
      // subscribe: () => pubsub.asyncIterator(['NEW_VENDOR_ADDED']),
    },
  },

  // Field resolvers
  User: {
    // Add any complex field resolvers here
  },

  Vendor: {
    // Add any complex field resolvers here
  },

  AIResponse: {
    // Add any complex field resolvers here
  },
};