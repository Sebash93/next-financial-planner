import { useState, useEffect } from "react";
import { Input } from "../ui/input";

type InputPercentageProps = {
    value: number | null | undefined;
    onChange: (value: number | null) => void;
    placeholder?: string;
} & Omit<React.ComponentProps<"input">, "value">;

export const InputPercentage = ({ value, onChange, placeholder, ...props }: InputPercentageProps) => {
    const [inputValue, setInputValue] = useState<string>(value?.toString() ?? "");

    useEffect(() => {
        setInputValue(value?.toString() ?? "");
    }, [value]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        // Allow empty, digits, and one decimal point
        if (newValue === "" || /^\d*\.?\d*$/.test(newValue)) {
            setInputValue(newValue);
        }
    };

    const handleBlur = () => {
        if (inputValue === "") {
            onChange(null);
        } else {
            const parsed = parseFloat(inputValue);
            onChange(isNaN(parsed) ? null : parsed);
        }
    };

    return (
        <Input
            {...props}
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
        />
    );
};
