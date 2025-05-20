
type GridCellDictionaryProps = {
    dictionary: Record<string, string>
    value: string
}

export const GridCellDictionary = ({
    dictionary,
    value,
}: GridCellDictionaryProps) => {
    const formattedValue = dictionary[value] || value
    return <div>{formattedValue}</div>
}