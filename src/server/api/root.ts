import { createTRPCRouter } from './trpc';
import { aiRouter } from './routers/ai';

export const appRouter = createTRPCRouter({
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;