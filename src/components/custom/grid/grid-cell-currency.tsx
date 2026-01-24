import { numberToCurrency } from "@/utils/currencies"

type GridCellCurrencyProps = {
    amount: number | null | undefined
}

export const GridCellCurrency = ({ amount }: GridCellCurrencyProps) => {
    const numericValue = amount ?? 0
    const formattedCurrency = numberToCurrency(numericValue)
    return <div>{formattedCurrency}</div>
}