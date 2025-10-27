import { createTRPCRouter } from './trpc';
import { aiRouter } from './routers/ai';
import { paymentRouter } from './routers/payment';
import { vinRouter } from './routers/vin';

export const appRouter = createTRPCRouter({
  ai: aiRouter,
  payment: paymentRouter,
  vin: vinRouter,
});

export type AppRouter = typeof appRouter;