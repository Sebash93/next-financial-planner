import { z } from "zod";

export const newCreditRecordFormSchema = z.object({
  name: z.string().min(1).max(255),
  bucketId: z.number().optional(),
  date: z.number().min(1), // Fecha Saldo (epoch ms) — required, must be set

  currentBalance: z.number().min(0),
  monthlyPayment: z.number().min(0),
  interestRate: z.number().min(0),
  otherCosts: z.number().min(0).optional(),
});
