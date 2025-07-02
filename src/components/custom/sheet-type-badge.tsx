import { Sheet } from "@prisma/client"
import { Badge } from "../ui/badge"

const sheetTypeMap: Record<Sheet["sheetType"], string> = {
    "INCOME": "Ingreso",
    "BUDGET": "Presupuesto",
    "EXPENSE_FLOW": "Flujo",
}

type SheetTypeBadgeProps = {
    value: Sheet["sheetType"]
}

export const SheetTypeBadge = ({ value }: SheetTypeBadgeProps) => {
    return <Badge variant="outline">
        {sheetTypeMap[value]}
    </Badge>
}