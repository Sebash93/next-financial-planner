import { currencyToNumber, numberToCurrency } from "@/utils/currencies";
import { Input } from "../ui/input";

type InputCurrencyProps = {
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
} & Omit<React.ComponentProps<"input">, "value">;

export const InputCurrency = ({ value, onChange, placeholder, ...props }: InputCurrencyProps) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        const numericValue = currencyToNumber(inputValue);
        onChange(numericValue);
    };

    return (
        <Input
            {...props}
            value={numberToCurrency(value)}
            onChange={handleChange}
            placeholder={placeholder}
        />
    );
};