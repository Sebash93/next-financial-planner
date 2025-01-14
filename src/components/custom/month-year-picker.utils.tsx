export const getMonthFromTimestamp = (timestamp: number) => {
    // Get month with 2 digits (01, 02, 03, ..., 12)
    const month = new Date(timestamp).getMonth();
    return month.toString().padStart(2, '0');
}

export const getYearFromTimestamp = (timestamp: number) => {
    return new Date(timestamp).getFullYear();
}