import { z } from "zod";

export const newBucketSchema = z.object({
  name: z.string().min(1).max(255),
});
