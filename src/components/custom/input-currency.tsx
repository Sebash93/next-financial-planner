import { currencyToNumber, numberToCurrency } from "@/utils/currencies";
import { Input } from "../ui/input";

type InputCurrencyProps = {
    value: number | null | undefined;
    onChange: (value: number) => void;
    placeholder?: string;
} & Omit<React.ComponentProps<"input">, "value">;

export const InputCurrency = ({ value, onChange, placeholder, ...props }: InputCurrencyProps) => {
    const numericValue = value ?? 0;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        const parsed = currencyToNumber(inputValue);
        onChange(parsed);
    };

    return (
        <Input
            {...props}
            value={numberToCurrency(numericValue)}
            onChange={handleChange}
            placeholder={placeholder}
        />
    );
};