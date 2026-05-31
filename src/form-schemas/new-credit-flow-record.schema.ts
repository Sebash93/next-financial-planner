import { z } from "zod";
import { startOfMonth } from "date-fns";

export const newCreditFlowRecordSchema = z.object({
  date: z.number().refine((date) => date >= startOfMonth(new Date()).getTime(), {
    message: "La fecha no puede ser anterior al mes actual.",
  }),
  creditRecordId: z.number(),
  amount: z.number().min(1),
});
