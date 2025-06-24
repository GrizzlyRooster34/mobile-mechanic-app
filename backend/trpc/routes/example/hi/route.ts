import { publicProcedure } from "../../../create-context";

const hiProcedure = publicProcedure.query(() => {
  return "Hello from tRPC!";
});

export default hiProcedure;