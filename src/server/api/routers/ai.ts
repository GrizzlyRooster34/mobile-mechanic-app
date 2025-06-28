import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { getCustomerSupportAgent, type CustomerSupportContext } from "~/lib/ai/customer-support";
import { getMechanicAssistantAgent, type MechanicContext } from "~/lib/ai/mechanic-assistant";
import { queryAbacus, queryAbacusMechanicAssistant } from "~/lib/abacusClient";

export const aiRouter = createTRPCRouter({
  // Customer Support Agent Endpoints
  customerSupport: createTRPCRouter({
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(1000),
        sessionId: z.string().optional(),
        customerId: z.string().optional(),
        context: z.object({
          customerId: z.string().optional(),
          customerName: z.string().optional(),
          customerPhone: z.string().optional(),
          customerEmail: z.string().optional(),
          vehicleInfo: z.object({
            make: z.string().optional(),
            model: z.string().optional(),
            year: z.number().optional(),
            vin: z.string().optional(),
            mileage: z.number().optional(),
          }).optional(),
          currentJob: z.object({
            id: z.string(),
            status: z.string(),
            description: z.string().optional(),
            estimatedCost: z.number().optional(),
          }).optional(),
          appointmentInfo: z.object({
            id: z.string().optional(),
            scheduledDate: z.string().optional(),
            location: z.string().optional(),
            serviceType: z.string().optional(),
          }).optional(),
          paymentInfo: z.object({
            lastPaymentStatus: z.string().optional(),
            outstandingBalance: z.number().optional(),
          }).optional(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get user ID from session
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        // Verify user can only access their own customer data
        if (input.customerId && input.customerId !== userId) {
          throw new Error('Unauthorized access to customer data');
        }
        
        const agent = getCustomerSupportAgent();
        return await agent.handleCustomerQuery({
          message: input.message,
          sessionId: input.sessionId,
          customerId: input.customerId || userId,
          context: input.context as CustomerSupportContext,
        });
      }),

    getHistory: protectedProcedure
      .input(z.object({
        customerId: z.string(),
      }))
      .query(async ({ input }) => {
        const agent = getCustomerSupportAgent();
        return await agent.getCustomerHistory(input.customerId);
      }),
  }),

  // Mechanic Assistant Agent Endpoints
  mechanicAssistant: createTRPCRouter({
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(1000),
        sessionId: z.string().optional(),
        mechanicId: z.string(),
        context: z.object({
          mechanicId: z.string(),
          mechanicName: z.string(),
          certifications: z.array(z.string()).optional(),
          specializations: z.array(z.string()).optional(),
          currentJob: z.object({
            id: z.string(),
            customerId: z.string(),
            vehicleInfo: z.object({
              make: z.string(),
              model: z.string(),
              year: z.number(),
              vin: z.string().optional(),
              mileage: z.number().optional(),
            }),
            symptoms: z.array(z.string()),
            diagnosticCodes: z.array(z.string()).optional(),
            partsNeeded: z.array(z.object({
              partNumber: z.string(),
              description: z.string(),
              quantity: z.number(),
              estimatedCost: z.number(),
            })).optional(),
            laborEstimate: z.object({
              hours: z.number(),
              rate: z.number(),
            }).optional(),
            status: z.enum(['diagnostic', 'quoted', 'approved', 'in_progress', 'completed']),
          }).optional(),
          tools: z.array(z.string()).optional(),
          location: z.object({
            latitude: z.number(),
            longitude: z.number(),
            address: z.string(),
          }).optional(),
        }).optional(),
        attachments: z.array(z.object({
          type: z.enum(['image', 'video', 'audio', 'document']),
          url: z.string(),
          description: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const agent = getMechanicAssistantAgent();
        return await agent.assistMechanic({
          message: input.message,
          sessionId: input.sessionId,
          mechanicId: input.mechanicId,
          context: input.context as MechanicContext,
          attachments: input.attachments,
        });
      }),

    decodeVIN: protectedProcedure
      .input(z.object({
        vin: z.string().length(17),
      }))
      .mutation(async ({ input }) => {
        const agent = getMechanicAssistantAgent();
        return await agent.decodeVIN(input.vin);
      }),

    getMaintenanceSchedule: protectedProcedure
      .input(z.object({
        make: z.string(),
        model: z.string(),
        year: z.number(),
        mileage: z.number(),
      }))
      .query(async ({ input }) => {
        const agent = getMechanicAssistantAgent();
        return await agent.getMaintenanceSchedule(input);
      }),

    // Direct Abacus AI suggestion endpoint for mechanics
    getAbacusSuggestion: protectedProcedure
      .input(z.object({ 
        jobId: z.string(), 
        description: z.string(),
        mechanicId: z.string().optional(),
        vehicleInfo: z.object({
          make: z.string().optional(),
          model: z.string().optional(),
          year: z.number().optional(),
          vin: z.string().optional(),
        }).optional(),
      }))
      .query(async ({ input, ctx }) => {
        try {
          const sessionId = `job_${input.jobId}_${Date.now()}`;
          const context = {
            mechanicId: input.mechanicId || ctx.session?.user?.id,
            jobId: input.jobId,
            vehicleInfo: input.vehicleInfo,
          };
          
          const result = await queryAbacusMechanicAssistant(
            sessionId,
            `Please provide diagnostic suggestions for: ${input.description}`,
            context
          );
          
          return { 
            reply: result.reply,
            suggestions: result.suggestions,
            confidence: result.confidence,
            sessionId 
          };
        } catch (error) {
          console.error('Abacus suggestion error:', error);
          throw new Error('Failed to get AI suggestion');
        }
      }),

    // General mechanic chat endpoint
    mechanicChat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(1000),
        sessionId: z.string().optional(),
        jobId: z.string().optional(),
        mechanicId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const sessionId = input.sessionId || `mechanic_${ctx.session?.user?.id}_${Date.now()}`;
          const context = {
            mechanicId: input.mechanicId || ctx.session?.user?.id,
            jobId: input.jobId,
          };
          
          const result = await queryAbacusMechanicAssistant(
            sessionId,
            input.message,
            context
          );
          
          return {
            reply: result.reply,
            suggestions: result.suggestions,
            confidence: result.confidence,
            sessionId
          };
        } catch (error) {
          console.error('Mechanic chat error:', error);
          throw new Error('Failed to process chat message');
        }
      }),
  }),

  // Health check endpoint
  healthCheck: publicProcedure
    .query(async () => {
      try {
        const customerAgent = getCustomerSupportAgent();
        const mechanicAgent = getMechanicAssistantAgent();
        
        // You could add actual health checks here
        return {
          status: 'healthy',
          timestamp: new Date(),
          agents: {
            customerSupport: 'available',
            mechanicAssistant: 'available',
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
});