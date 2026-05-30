import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { startOfMonth } from "date-fns"
import { getMonthFromTimestamp, getYearFromTimestamp } from "./month-year-picker.utils"

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default function MonthYearPicker({ value, onChange, minValue, maxValue }: {
    value: number,
    onChange: (value: number) => void,
    minValue?: number,
    maxValue?: number,
}) {
    const current = new Date(value)
    const newMonth = getMonthFromTimestamp(value)
    const newYear = getYearFromTimestamp(value)

    const isMonthDisabled = (monthIndex: number) => {
        const monthTs = startOfMonth(new Date(current.getFullYear(), monthIndex, 1)).getTime()
        if (minValue !== undefined && monthTs < startOfMonth(minValue).getTime()) return true
        if (maxValue !== undefined && monthTs > startOfMonth(maxValue).getTime()) return true
        return false
    }

    const startYear = minValue !== undefined ? new Date(minValue).getFullYear() : new Date().getFullYear()
    const endYear = maxValue !== undefined ? new Date(maxValue).getFullYear() : startYear + 9
    const years = Array.from({ length: Math.max(1, endYear - startYear + 1) }, (_, i) => startYear + i)

    const handleMonthChange = (month: string) => {
        onChange(new Date(value).setMonth(parseInt(month)))
    }

    const handleYearChange = (year: string) => {
        onChange(new Date(value).setFullYear(parseInt(year)))
    }

    return <div className="flex gap-x-2">
        <Select value={newMonth.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
                {MONTHS.map((label, idx) => (
                    <SelectItem
                        key={idx}
                        value={idx.toString().padStart(2, "0")}
                        disabled={isMonthDisabled(idx)}
                    >
                        {label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        <Select value={newYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
                {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                        {year}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
}
