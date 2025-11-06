const axios = require('axios');

// AI Agent resolvers - Integration with existing FastAPI service
const aiResolvers = {
  Query: {
    chatMessage: async (parent, args, context) => {
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
          try {
            aiResponse = JSON.parse(aiResponse);
          } catch (parseError) {
            // If it's just a string, wrap it in our expected format
            aiResponse = {
              message: aiResponse,
              confidence: null,
              sources: [],
              processingTime: null,
              metadata: null
            };
          }
        }

        return {
          message: aiResponse.output || aiResponse.message || 'No response from AI agent',
          confidence: aiResponse.confidence || null,
          sources: aiResponse.sources || [],
          processingTime: aiResponse.processingTime || null,
          metadata: aiResponse.metadata || aiResponse
        };

      } catch (error) {
        console.error('AI Agent chat error:', error);
        
        if (error.code === 'ECONNREFUSED') {
          throw new Error('AI service is currently unavailable');
        }
        
        if (error.response?.status === 401) {
          throw new Error('Authentication required for AI service');
        }
        
        if (error.code === 'ECONNABORTED') {
          throw new Error('AI service timeout - please try a simpler query');
        }

        throw new Error('Failed to get response from AI agent');
      }
    },

    emissionsCalculation: async (parent, args, context) => {
      try {
        // Forward to the emissions calculation tool in the AI agent
        const response = await axios.post(
          `${context.dataSources.aiAgentService}/chat`,
          {
            message: `Calculate carbon emissions for shipping ${args.input.weight}kg from ${args.input.origin} to ${args.input.destination} by ${args.input.transportMode}`
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(context.user && {
                'Authorization': `Bearer ${context.req.headers.authorization?.replace('Bearer ', '')}`
              })
            },
            timeout: 15000 // 15 second timeout for emissions calculations
          }
        );

        let result = response.data;
        
        // Parse the AI agent response to extract emissions data
        if (typeof result === 'string') {
          try {
            result = JSON.parse(result);
          } catch (parseError) {
            // Extract basic info from text response
            const carbonMatch = result.match(/(\d+\.?\d*)\s*(kg|tonnes?)\s*(?:of\s+)?(?:CO2|carbon)/i);
            const distanceMatch = result.match(/(\d+\.?\d*)\s*(?:km|kilometers?|miles?)/i);
            
            return {
              carbonFootprint: carbonMatch ? parseFloat(carbonMatch[1]) : 0,
              unit: carbonMatch?.[2] || 'kg',
              transportMode: args.input.transportMode,
              distance: distanceMatch ? parseFloat(distanceMatch[1]) : 0,
              calculations: {
                rawResponse: result,
                parsed: true
              }
            };
          }
        }

        // Extract structured data from AI response
        return {
          carbonFootprint: result.carbonFootprint || result.emissions || 0,
          unit: result.unit || 'kg CO2e',
          transportMode: result.transportMode || args.input.transportMode,
          distance: result.distance || 0,
          calculations: result.calculations || result
        };

      } catch (error) {
        console.error('Emissions calculation error:', error);
        
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Emissions calculation service is currently unavailable');
        }
        
        throw new Error('Failed to calculate emissions');
      }
    },
  },
};

module.exports = { aiResolvers };