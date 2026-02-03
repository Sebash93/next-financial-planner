import { startOfMonth } from 'date-fns'

export const getStartOfCurrentMonth = () => {
    return startOfMonth(new Date())
}

export const getOneYearLater = (date: Date) => {
    const result = new Date(date)
    result.setFullYear(result.getFullYear() + 1)
    return result
}

export const getDateFromTimestamp = (timestamp: number) => {
    return new Date(timestamp)
}

export const getTimestampFromDate = (date: Date) => {
    return date.getTime()
}