import { z } from "zod";

export const newExpenseFlowRecordSchema = z.object({
  name: z.string().min(1).max(255),
  date: z.number(),
  amount: z.number(),
});
