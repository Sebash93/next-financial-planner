import { z } from "zod";

export const newTagFormSchema = z.object({
  name: z.string().min(1).max(255),
  color: z.string().min(1).max(255),
});
