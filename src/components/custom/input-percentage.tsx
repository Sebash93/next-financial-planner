import { useState, useEffect } from "react";
import { Input } from "../ui/input";

type InputPercentageProps = {
    value: number | null | undefined;
    onChange: (value: number | null) => void;
    placeholder?: string;
} & Omit<React.ComponentProps<"input">, "value">;

const formatDisplayValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    // Round to 2 decimal places and use comma as separator
    const rounded = Math.round(value * 100) / 100;
    return rounded.toString().replace(".", ",");
};

const parseInputToNumber = (input: string): number | null => {
    if (input === "" || input === ",") return null;
    // Replace comma with dot for parsing
    const normalized = input.replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
};

export const InputPercentage = ({ value, onChange, placeholder, ...props }: InputPercentageProps) => {
    const [inputValue, setInputValue] = useState<string>(formatDisplayValue(value));

    useEffect(() => {
        setInputValue(formatDisplayValue(value));
    }, [value]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;

        // Replace dot with comma
        let newValue = rawValue.replace(".", ",");

        // Only allow digits and one comma
        if (!/^\d*,?\d*$/.test(newValue)) {
            return;
        }

        // Limit to 2 decimal places
        const commaIndex = newValue.indexOf(",");
        if (commaIndex !== -1) {
            const decimals = newValue.substring(commaIndex + 1);
            if (decimals.length > 2) {
                newValue = newValue.substring(0, commaIndex + 3);
            }
        }

        setInputValue(newValue);

        // Call onChange with the parsed number
        const parsed = parseInputToNumber(newValue);
        onChange(parsed);
    };

    return (
        <Input
            {...props}
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={handleChange}
            placeholder={placeholder}
        />
    );
};
