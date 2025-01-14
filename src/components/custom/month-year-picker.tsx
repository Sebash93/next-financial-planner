import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getMonthFromTimestamp, getYearFromTimestamp } from "./month-year-picker.utils"

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i)

export default function MonthYearPicker({ value, onChange }: {
    value: number,
    onChange: (value: number) => void
}) {

    const newMonth = getMonthFromTimestamp(value)
    const newYear = getYearFromTimestamp(value)

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
                <SelectItem value="00">Enero</SelectItem>
                <SelectItem value="01">Febrero</SelectItem>
                <SelectItem value="02">Marzo</SelectItem>
                <SelectItem value="03">Abril</SelectItem>
                <SelectItem value="04">Mayo</SelectItem>
                <SelectItem value="05">Junio</SelectItem>
                <SelectItem value="06">Julio</SelectItem>
                <SelectItem value="07">Agosto</SelectItem>
                <SelectItem value="08">Septiembre</SelectItem>
                <SelectItem value="09">Octubre</SelectItem>
                <SelectItem value="10">Noviembre</SelectItem>
                <SelectItem value="11">Diciembre</SelectItem>
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