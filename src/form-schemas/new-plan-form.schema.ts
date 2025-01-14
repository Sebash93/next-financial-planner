import { z } from "zod"

export const newPlanFormSchema = z.object({    
    name: z.string().min(1).max(255),
    initialDate: z.number(),
    endDate: z.number(),
}).refine(data => data.initialDate < data.endDate, {
    message: "Initial date must be before end date",
    path: ["initialDate"],
})