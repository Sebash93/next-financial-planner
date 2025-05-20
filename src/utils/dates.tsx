import { startOfMonth } from 'date-fns'

export const getStartOfCurrentMonth = () => {
    return startOfMonth(new Date())
}

export const getDateFromTimestamp = (timestamp: number) => {
    return new Date(timestamp)
}

export const getTimestampFromDate = (date: Date) => {
    return date.getTime()
}