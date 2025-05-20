import { numberToCurrency } from "@/utils/currencies"

type GridCellCurrencyProps = {
    amount: number
}

export const GridCellCurrency = ({ amount }: GridCellCurrencyProps) => {
    const curreny = amount
    const formattedCurrency = numberToCurrency(curreny)
    return <div>{formattedCurrency}</div>
}