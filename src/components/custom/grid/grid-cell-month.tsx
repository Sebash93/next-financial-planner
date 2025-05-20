type GridCellMonthProps = {
    date: number;
};

export const GridCellMonth = ({ date }: GridCellMonthProps) => {
    const dateObj = new Date(date);
    const month = dateObj.toLocaleString("default", { month: "short", year: "numeric" });
    return <div className="capitalize">{month}</div>;
};