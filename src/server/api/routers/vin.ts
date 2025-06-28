import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { decodeVIN, enhancedVinAnalysis, batchDecodeVINs } from "~/lib/vinTools";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";

export const vinRouter = createTRPCRouter({
  // Decode a single VIN
  decode: protectedProcedure
    .input(z.object({
      vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/, "Invalid VIN format"),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        const result = await decodeVIN(input.vin);
        
        // Log decode attempt to history (if we have vehicle ID)
        // This would need vehicle lookup first in a real implementation
        
        return result;
      } catch (error) {
        console.error('VIN decode error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to decode VIN',
        });
      }
    }),

  // Enhanced VIN analysis with diagnostic suggestions  
  analyze: protectedProcedure
    .input(z.object({
      vin: z.string().length(17),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        const analysis = await enhancedVinAnalysis(input.vin);
        return analysis;
      } catch (error) {
        console.error('VIN analysis error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to analyze VIN',
        });
      }
    }),

  // Set VIN on a service request/job
  setJobVin: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      vin: z.string().length(17),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        // Verify user owns this job or is the assigned mechanic
        const job = await db.serviceRequest.findFirst({
          where: {
            id: input.jobId,
            OR: [
              { customerId: userId },
              { mechanicId: userId }
            ]
          },
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found or unauthorized',
          });
        }

        // Decode VIN to get engine code
        const decoded = await decodeVIN(input.vin);
        
        // Update job with VIN data
        const updatedJob = await db.serviceRequest.update({
          where: { id: input.jobId },
          data: {
            jobVin: input.vin,
            jobEngineCode: decoded.engineCode || 'Unknown'
          }
        });

        // Create decode history record
        if (job.vehicleId) {
          await db.vINDecodeHistory.create({
            data: {
              vehicleId: job.vehicleId,
              vin: input.vin,
              decodedData: JSON.parse(JSON.stringify(decoded.raw || {})),
              source: 'NHTSA',
              success: !decoded.error,
              errorMessage: decoded.error,
              make: decoded.make,
              model: decoded.model,
              year: decoded.year,
              engineCode: decoded.engineCode,
            }
          });
        }

        return {
          job: updatedJob,
          vinData: decoded
        };
      } catch (error) {
        console.error('Set job VIN error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set job VIN',
        });
      }
    }),

  // Update vehicle with VIN decode data
  updateVehicle: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      vin: z.string().length(17),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        // Verify user owns this vehicle
        const vehicle = await db.vehicle.findFirst({
          where: {
            id: input.vehicleId,
            customer: {
              userId: userId
            }
          },
        });

        if (!vehicle) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vehicle not found or unauthorized',
          });
        }

        // Decode VIN
        const decoded = await decodeVIN(input.vin);
        
        // Update vehicle with decoded information
        const updatedVehicle = await db.vehicle.update({
          where: { id: input.vehicleId },
          data: {
            vin: input.vin,
            make: decoded.make || vehicle.make,
            model: decoded.model || vehicle.model,
            year: decoded.year || vehicle.year,
            engineCode: decoded.engineCode,
            displacement: decoded.displacement,
            fuelType: decoded.fuelType,
            driveType: decoded.driveType,
            vinDecodeDate: new Date(),
            vinDecodeSource: 'NHTSA',
          }
        });

        // Create decode history record
        await db.vINDecodeHistory.create({
          data: {
            vehicleId: input.vehicleId,
            vin: input.vin,
            decodedData: JSON.parse(JSON.stringify(decoded.raw || {})),
            source: 'NHTSA',
            success: !decoded.error,
            errorMessage: decoded.error,
            make: decoded.make,
            model: decoded.model,
            year: decoded.year,
            engineCode: decoded.engineCode,
          }
        });

        return {
          vehicle: updatedVehicle,
          vinData: decoded
        };
      } catch (error) {
        console.error('Update vehicle VIN error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update vehicle with VIN data',
        });
      }
    }),

  // Get VIN decode history for a vehicle
  getHistory: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Verify user owns this vehicle or is an assigned mechanic
      const vehicle = await db.vehicle.findFirst({
        where: {
          id: input.vehicleId,
          OR: [
            {
              customer: {
                userId: userId
              }
            },
            {
              serviceRequests: {
                some: {
                  mechanicId: userId
                }
              }
            }
          ]
        },
      });

      if (!vehicle) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vehicle not found or unauthorized',
        });
      }

      const history = await db.vINDecodeHistory.findMany({
        where: {
          vehicleId: input.vehicleId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: input.limit
      });

      return history;
    }),

  // Batch decode VINs (admin/mechanic only)
  batchDecode: protectedProcedure
    .input(z.object({
      vins: z.array(z.string().length(17)).max(20), // Limit batch size
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Check if user is mechanic or admin
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user || !['MECHANIC', 'ADMIN'].includes(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Batch decode requires mechanic or admin role',
        });
      }

      try {
        const results = await batchDecodeVINs(input.vins, 3); // Small batch size
        return results;
      } catch (error) {
        console.error('Batch decode error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to batch decode VINs',
        });
      }
    }),
});