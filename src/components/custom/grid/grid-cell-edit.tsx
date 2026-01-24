import { Input } from "@/components/ui/input"
import { ColumnDef } from "@tanstack/react-table"
import { DatePicker } from "../date-picker"
import { getDateFromTimestamp, getTimestampFromDate } from "@/utils/dates"
import { InputCurrency } from "../input-currency"
import { InputSelect } from "../input-select"
import { Bucket, Tag } from "@prisma/client"
import { useMemo } from "react"

type GridCellEditProps<TData, TValue> = {
    column: ColumnDef<TData, TValue>
    value: unknown
    tags?: Tag[]
    buckets?: Bucket[]
    accessor: string
    onChange: (value: unknown) => void
}

export const GridCellEdit = <TData, TValue>({ column, value, tags, buckets, onChange }: GridCellEditProps<TData, TValue>) => {
    const tagsOptions = useMemo(() => {
        return tags?.map(({ name, id }) => ({
            value: id,
            label: name
        })) || []
    }, [tags])

    const bucketOptions = useMemo(() => {
        return buckets?.map(({ name, id }) => ({
            value: id,
            label: name
        })) || []
    }, [buckets])

    const handleChange = (value: unknown) => {
        if (column.id === "date") {
            onChange(getTimestampFromDate(value as Date))
        } else if (column.id === "amount" || column.id === "tag" || column.id === "bucket") {
            onChange(value)
        } else {
            onChange((value as React.ChangeEvent<HTMLInputElement>).target.value)
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
    if (column.id === "tag" && tagsOptions) {
        return <InputSelect
            value={value as string}
            defaultValue={value as string}
            options={tagsOptions}
            onChange={handleChange}
            placeholder={String(
                column.header
            )} />
    }
    if (column.id === "bucket" && bucketOptions) {
        return <InputSelect
            value={value as string}
            defaultValue={value as string}
            options={bucketOptions}
            onChange={handleChange}
            placeholder={String(
                column.header
            )} />
    }
    return <Input
        value={value as string}
        onChange={handleChange}
        placeholder={String(
            column.header
        )}
    />
}