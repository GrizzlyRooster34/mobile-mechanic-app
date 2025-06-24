import { createTRPCRouter } from "./create-context";
import hiProcedure from "./routes/example/hi/route";
import { diagnosisProcedure } from "./routes/diagnosis/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiProcedure
  }),
  diagnosis: createTRPCRouter({
    diagnose: diagnosisProcedure
  })
});

export type AppRouter = typeof appRouter;