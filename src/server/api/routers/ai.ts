import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { getCustomerSupportAgent, type CustomerSupportContext } from "~/lib/ai/customer-support";
import { getMechanicAssistantAgent, type MechanicContext } from "~/lib/ai/mechanic-assistant";

export const aiRouter = createTRPCRouter({
  // Customer Support Agent Endpoints
  customerSupport: createTRPCRouter({
    chat: publicProcedure
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
      .mutation(async ({ input }) => {
        const agent = getCustomerSupportAgent();
        return await agent.handleCustomerQuery({
          message: input.message,
          sessionId: input.sessionId,
          customerId: input.customerId,
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