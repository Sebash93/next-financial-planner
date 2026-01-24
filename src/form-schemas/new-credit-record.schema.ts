import { z } from "zod";

export const newCreditRecordFormSchema = z.object({
  name: z.string().min(1).max(255),
  bucketId: z.number().optional(),
  currentBalance: z.number().min(0),
  monthlyPayment: z.number().min(0),
  interestRate: z.number().min(0),
  additionalPayment: z.number().min(0),
});
