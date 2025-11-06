import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { typeDefs } from './schema/index';
import { resolvers } from './resolvers/index';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimit';
import depthLimit from 'graphql-depth-limit';

const PORT = process.env.PORT || 4000;
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];

async function startServer() {
  // Create Express app
  const app = express();
  const httpServer = createServer(app);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
  }));

  // Logging middleware
  app.use(morgan('combined'));

  // CORS configuration
  app.use(cors({
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Rate limiting middleware
  app.use(rateLimitMiddleware);

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      // Simple logging plugin
      {
        async requestDidStart() {
          return {
            async didResolveOperation(requestContext) {
              console.log(`GraphQL Operation: ${requestContext.operationName || 'anonymous'}`);
            }
          };
        }
      }
    ],
    validationRules: [
      depthLimit(10) // Limit query depth to prevent abuse
    ],
    formatError: (err) => {
      console.error('GraphQL Error:', err);
      
      // Don't leak internal errors in production
      if (process.env.NODE_ENV === 'production') {
        if (err.message.includes('Database') || err.message.includes('Internal')) {
          return new Error('Internal server error');
        }
      }
      
      return err;
    },
    introspection: process.env.NODE_ENV !== 'production',
  });

  // Start the server
  await server.start();

  // Apply GraphQL middleware
  app.use(
    '/graphql',
    express.json({ limit: '10mb' }),
    authMiddleware, // Apply auth middleware before GraphQL
    expressMiddleware(server, {
      context: async ({ req }) => ({
        user: (req as any).user || null,
        req,
        dataSources: {
          authService: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
          vendorService: process.env.VENDOR_SERVICE_URL || 'http://localhost:3002',
          aiAgentService: process.env.AI_AGENT_SERVICE_URL || 'http://localhost:8000'
        }
      })
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        graphql: 'healthy',
        auth: 'checking...',
        database: 'checking...'
      }
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Start HTTP server
  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL Gateway running at http://localhost:${PORT}/graphql`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS Origins: ${CORS_ORIGINS.join(', ')}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await server.stop();
    httpServer.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await server.stop();
    httpServer.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});