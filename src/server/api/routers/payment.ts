import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { stripeService } from "~/lib/stripe";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";

export const paymentRouter = createTRPCRouter({
  createPaymentIntent: protectedProcedure
    .input(z.object({
      serviceRequestId: z.string(),
      amount: z.number().min(100), // minimum $1.00
      currency: z.string().default('usd'),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user ID from session
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        // Verify the service request belongs to the user
        const serviceRequest = await db.serviceRequest.findFirst({
          where: {
            id: input.serviceRequestId,
            customerId: userId,
          },
          include: {
            customer: {
              include: {
                user: true,
              },
            },
          },
        });

        if (!serviceRequest) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Service request not found or unauthorized',
          });
        }

        // Create or get Stripe customer
        let stripeCustomerId = serviceRequest.customer.stripeCustomerId;
        if (!stripeCustomerId) {
          const stripeCustomer = await stripeService.createCustomer({
            email: serviceRequest.customer.user.email || '',
            name: serviceRequest.customer.user.name || undefined,
            metadata: {
              userId: userId,
              customerId: serviceRequest.customerId,
            },
          });
          
          stripeCustomerId = stripeCustomer.id;
          
          // Update customer with Stripe ID
          await db.customer.update({
            where: { id: serviceRequest.customerId },
            data: { stripeCustomerId },
          });
        }

        // Create payment intent
        const paymentIntent = await stripeService.createPaymentIntent({
          amount: input.amount,
          currency: input.currency,
          customerId: stripeCustomerId,
          description: input.description || `Payment for service request ${input.serviceRequestId}`,
          metadata: {
            serviceRequestId: input.serviceRequestId,
            customerId: serviceRequest.customerId,
            userId: userId,
          },
        });

        // Save payment record to database
        const payment = await db.payment.create({
          data: {
            amount: input.amount,
            currency: input.currency,
            method: 'CARD',
            status: 'PENDING',
            serviceRequestId: input.serviceRequestId,
            customerId: serviceRequest.customerId,
            stripePaymentId: paymentIntent.paymentIntentId,
            stripeCustomerId,
          },
        });

        return {
          clientSecret: paymentIntent.clientSecret,
          paymentId: payment.id,
          paymentIntentId: paymentIntent.paymentIntentId,
        };
      } catch (error) {
        console.error('Payment intent creation failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create payment intent',
          cause: error,
        });
      }
    }),

  confirmPayment: protectedProcedure
    .input(z.object({
      paymentIntentId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Retrieve payment intent from Stripe
        const paymentIntent = await stripeService.retrievePaymentIntent(input.paymentIntentId);
        
        // Find payment in database
        const payment = await db.payment.findFirst({
          where: {
            stripePaymentId: input.paymentIntentId,
          },
          include: {
            serviceRequest: {
              include: {
                customer: true,
              },
            },
          },
        });

        if (!payment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Payment not found',
          });
        }

        // Get user ID from session
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        // Verify user owns this payment
        if (payment.serviceRequest.customer.userId !== userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Unauthorized access to payment',
          });
        }

        // Update payment status based on Stripe status
        const status = paymentIntent.status === 'succeeded' ? 'COMPLETED' : 
                      paymentIntent.status === 'canceled' ? 'FAILED' : 'PENDING';

        const updatedPayment = await db.payment.update({
          where: { id: payment.id },
          data: {
            status,
            paidAt: paymentIntent.status === 'succeeded' ? new Date() : null,
          },
        });

        // If payment succeeded, update service request status
        if (paymentIntent.status === 'succeeded') {
          await db.serviceRequest.update({
            where: { id: payment.serviceRequestId },
            data: { status: 'COMPLETED' },
          });
        }

        return {
          payment: updatedPayment,
          stripeStatus: paymentIntent.status,
        };
      } catch (error) {
        console.error('Payment confirmation failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to confirm payment',
          cause: error,
        });
      }
    }),

  getPaymentHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      // Get user ID from session
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const payments = await db.payment.findMany({
        where: {
          serviceRequest: {
            customer: {
              userId: userId,
            },
          },
        },
        include: {
          serviceRequest: {
            select: {
              id: true,
              description: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });

      return payments;
    }),

  requestRefund: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
      reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).default('requested_by_customer'),
      amount: z.number().optional(), // if not provided, refunds full amount
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user ID from session
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        // Find payment and verify ownership
        const payment = await db.payment.findFirst({
          where: {
            id: input.paymentId,
            serviceRequest: {
              customer: {
                userId: userId,
              },
            },
          },
          include: {
            serviceRequest: true,
          },
        });

        if (!payment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Payment not found or unauthorized',
          });
        }

        if (payment.status !== 'COMPLETED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot refund payment that is not completed',
          });
        }

        // Create refund in Stripe
        const refund = await stripeService.createRefund({
          paymentIntentId: payment.stripePaymentId!,
          amount: input.amount,
          reason: input.reason,
          metadata: {
            paymentId: payment.id,
            serviceRequestId: payment.serviceRequestId,
          },
        });

        // Update payment record
        const updatedPayment = await db.payment.update({
          where: { id: payment.id },
          data: {
            refundAmount: refund.amount,
            refundReason: input.reason,
            refundedAt: new Date(),
          },
        });

        return {
          payment: updatedPayment,
          refund,
        };
      } catch (error) {
        console.error('Refund request failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process refund',
          cause: error,
        });
      }
    }),
});