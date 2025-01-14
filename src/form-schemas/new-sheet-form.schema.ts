import { z } from "zod"

export const newSheetFormSchema = z.object({    
    name: z.string().min(1).max(120),
    sheetType: z.string().min(1).max(120),
})