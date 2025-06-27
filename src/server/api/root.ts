import { createTRPCRouter } from './trpc';
import { aiRouter } from './routers/ai';
import { paymentRouter } from './routers/payment';

export const appRouter = createTRPCRouter({
  ai: aiRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;