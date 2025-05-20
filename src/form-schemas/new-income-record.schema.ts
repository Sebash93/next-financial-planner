import { z } from "zod";

export const newIcomeRecordSchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number(),
});
