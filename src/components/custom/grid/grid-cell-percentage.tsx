type GridCellPercentageProps = {
    value: number | null | undefined
}

export const GridCellPercentage = ({ value }: GridCellPercentageProps) => {
    const numericValue = value ?? 0
    return <div>{numericValue.toFixed(2)}</div>
}
