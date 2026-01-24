import { Input } from "@/components/ui/input"
import { ColumnDef } from "@tanstack/react-table"
import { DatePicker } from "../date-picker"
import { getDateFromTimestamp, getTimestampFromDate } from "@/utils/dates"
import { InputCurrency } from "../input-currency"
import { InputPercentage } from "../input-percentage"
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

export const GridCellEdit = <TData, TValue>({ column, value, tags, buckets, accessor, onChange }: GridCellEditProps<TData, TValue>) => {
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

    const currencyAccessors = ["amount", "currentBalance", "monthlyPayment", "additionalPayment"]

    const handleChange = (value: unknown) => {
        if (accessor === "date") {
            onChange(getTimestampFromDate(value as Date))
        } else if (currencyAccessors.includes(accessor) || accessor === "interestRate") {
            onChange(value)
        } else if (accessor === "tagId" || accessor === "bucketId") {
            onChange(parseInt(value as string, 10))
        } else {
            onChange((value as React.ChangeEvent<HTMLInputElement>).target.value)
        }
    }
    if (accessor === "date") {
        return <DatePicker value={value ? getDateFromTimestamp(value as number) : undefined} onChange={handleChange} />
    }
    if (currencyAccessors.includes(accessor)) {
        return <InputCurrency
            value={value as number}
            onChange={handleChange}
            placeholder={String(
                column.header
            )}
        />
    }
    if (accessor === "interestRate") {
        return <InputPercentage
            value={value as number}
            onChange={handleChange}
            placeholder={String(
                column.header
            )}
        />
    }
    if (accessor === "tagId" && tagsOptions) {
        return <InputSelect
            value={value != null ? String(value) : null}
            options={tagsOptions}
            onChange={handleChange}
            placeholder={String(
                column.header
            )} />
    }
    if (accessor === "bucketId" && bucketOptions) {
        return <InputSelect
            value={value != null ? String(value) : null}
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