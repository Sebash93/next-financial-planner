import { z } from "zod";

export const newBudgetRecordFormSchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number(),
  tagId: z.number(),
  bucketId: z.number(),
});
