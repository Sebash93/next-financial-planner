import { z } from "zod";
import { startOfMonth } from "date-fns";

export const newExpenseFlowRecordSchema = z.object({
  name: z.string().min(1).max(255),
  date: z.number().refine((date) => date >= startOfMonth(new Date()).getTime(), {
    message: "La fecha no puede ser anterior al mes actual.",
  }),
  amount: z.number(),
  bucketId: z.number().optional(),
});
