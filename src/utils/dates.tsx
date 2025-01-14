import { startOfMonth } from 'date-fns'

export const getStartOfCurrentMonth = () => {
    return startOfMonth(new Date())
}