import { z } from "zod";
import { EnumSheetType } from "@prisma/client";
const enumSheetTypes = Object.values(EnumSheetType) as [string, ...string[]];

export const newSheetFormSchema = z.object({
  name: z.string().min(1).max(120),
  sheetType: z.enum(enumSheetTypes),
});
