import { Input } from "@/components/ui/input"
import { ColumnDef } from "@tanstack/react-table"
import { DatePicker } from "../date-picker"
import { getDateFromTimestamp, getTimestampFromDate } from "@/utils/dates"
import { InputCurrency } from "../input-currency"

type GridCellEditProps<TData, TValue> = {
    column: ColumnDef<TData, TValue>
    value: unknown
    accessor: string
    onChange: (value: unknown) => void
}

export const GridCellEdit = <TData, TValue>({ column, value, onChange }: GridCellEditProps<TData, TValue>) => {
    const handleChange = (value: unknown) => {
        if (column.id === "date") {
            onChange(getTimestampFromDate(value as Date))
        } else if (column.id === "amount") {
            onChange(value)
        } else {
            onChange(value.target.value)
        }
    }
    if (column.id === "date") {
        return <DatePicker value={value ? getDateFromTimestamp(value as number) : undefined} onChange={handleChange} />
    }
    if (column.id === "amount") {
        return <InputCurrency
            value={value as number}
            onChange={handleChange}
            placeholder={String(
                column.header
            )}
        />
    }
    return <Input
        value={value as string}
        onChange={handleChange}
        placeholder={String(
            column.header
        )}
    />
}