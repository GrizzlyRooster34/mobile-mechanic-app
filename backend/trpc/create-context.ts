import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

// Create context for tRPC
export const createTRPCContext = async (opts: { req?: any; res?: any }) => {
  // Log request for monitoring in production
  if (opts.req && !process.env.NODE_ENV?.includes('development')) {
    console.log('tRPC request:', {
      method: opts.req.method,
      url: opts.req.url,
      userAgent: opts.req.headers?.['user-agent'],
      timestamp: new Date().toISOString(),
    });
  }

  return {
    req: opts.req,
    res: opts.res,
    // Add any other context data here
    environment: process.env.NODE_ENV || 'development',
    isProduction: !process.env.NODE_ENV?.includes('development'),
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Enhanced error logging for production
    if (!process.env.NODE_ENV?.includes('development')) {
      console.error('tRPC error:', {
        code: error.code,
        message: error.message,
        cause: error.cause,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      ...shape,
      data: {
        ...shape.data,
        // Don't expose internal errors in production
        ...(process.env.NODE_ENV?.includes('development') && {
          stack: error.stack,
        }),
      },
    };
  },
});

// Export reusable router and procedure helpers
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Middleware for authentication (if needed)
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // Add authentication logic here if needed
  // For now, just pass through
  return next({
    ctx: {
      ...ctx,
      // Add user context if authenticated
    },
  });
});