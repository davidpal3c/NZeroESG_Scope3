import axios from 'axios';

// AI Agent resolvers - Integration with existing FastAPI service
export const aiResolvers = {
  Query: {
    chatMessage: async (parent: any, args: any, context: any) => {
      try {
        // Forward the chat message to the existing AI agent service
        const response = await axios.post(
          `${context.dataSources.aiAgentService}/chat`,
          {
            message: args.message
          },
          {
            headers: {
              'Content-Type': 'application/json',
              // Pass user context if authenticated
              ...(context.user && {
                'Authorization': `Bearer ${context.req.headers.authorization?.replace('Bearer ', '')}`
              })
            },
            timeout: 30000 // 30 second timeout for AI responses
          }
        );

        // Parse the response from the existing AI agent
        let aiResponse = response.data;
        
        // Handle different response formats from the existing service
        if (typeof aiResponse === 'string') {
          aiResponse = { response: aiResponse };
        }

        return {
          id: String(Date.now()), // Generate a simple ID for the response
          message: args.message,
          response: aiResponse.response || aiResponse.content || 'No response received',
          timestamp: new Date(),
          user: context.user || null,
          metadata: {
            processingTime: response.headers['x-processing-time'] || null,
            model: aiResponse.model || 'unknown',
            tokens: aiResponse.usage?.total_tokens || null
          }
        };
      } catch (error: any) {
        console.error('AI Agent Error:', error);
        
        // Return error response in expected format
        return {
          id: String(Date.now()),
          message: args.message,
          response: `Sorry, I encountered an error processing your request: ${error.message}`,
          timestamp: new Date(),
          user: context.user || null,
          metadata: {
            error: true,
            errorType: error.code || 'UNKNOWN_ERROR'
          }
        };
      }
    },

    chatHistory: async (parent: any, args: any, context: any) => {
      // Only authenticated users can access chat history
      if (!context.user) {
        throw new Error('Authentication required to access chat history');
      }

      try {
        // In Phase 1, return mock data
        // Phase 2+ will integrate with actual chat history storage
        const mockHistory = [
          {
            id: '1',
            message: 'What is the carbon footprint of shipping from Toronto to Vancouver?',
            response: 'The carbon footprint for shipping from Toronto to Vancouver depends on the transport method...',
            timestamp: new Date('2024-01-15T10:00:00Z'),
            user: context.user,
            metadata: {
              processingTime: 1250,
              model: 'claude-3-haiku',
              tokens: 142
            }
          },
          {
            id: '2',
            message: 'Find suppliers for eco-friendly packaging in Canada',
            response: 'I found several eco-friendly packaging suppliers in Canada...',
            timestamp: new Date('2024-01-15T10:05:00Z'),
            user: context.user,
            metadata: {
              processingTime: 2100,
              model: 'claude-3-haiku',
              tokens: 267
            }
          }
        ];

        // Apply pagination if provided
        const limit = args.limit || 50;
        const offset = args.offset || 0;
        
        return mockHistory.slice(offset, offset + limit);
      } catch (error: any) {
        console.error('Chat History Error:', error);
        throw new Error('Failed to retrieve chat history');
      }
    }
  },

  Mutation: {
    sendChatMessage: async (parent: any, args: any, context: any) => {
      try {
        // Forward the chat message to the existing AI agent service
        const response = await axios.post(
          `${context.dataSources.aiAgentService}/chat`,
          {
            message: args.input.message,
            context: args.input.context || {}
          },
          {
            headers: {
              'Content-Type': 'application/json',
              // Pass user context if authenticated
              ...(context.user && {
                'Authorization': `Bearer ${context.req.headers.authorization?.replace('Bearer ', '')}`
              })
            },
            timeout: 30000
          }
        );

        // Parse the response from the existing AI agent
        let aiResponse = response.data;
        
        if (typeof aiResponse === 'string') {
          aiResponse = { response: aiResponse };
        }

        const chatMessage = {
          id: String(Date.now()),
          message: args.input.message,
          response: aiResponse.response || aiResponse.content || 'No response received',
          timestamp: new Date(),
          user: context.user || null,
          metadata: {
            processingTime: response.headers['x-processing-time'] || null,
            model: aiResponse.model || 'unknown',
            tokens: aiResponse.usage?.total_tokens || null
          }
        };

        return {
          chatMessage,
          success: true,
          message: 'Chat message processed successfully'
        };
      } catch (error: any) {
        console.error('Send Chat Message Error:', error);
        
        return {
          chatMessage: null,
          success: false,
          message: `Failed to process chat message: ${error.message}`
        };
      }
    }
  }
};