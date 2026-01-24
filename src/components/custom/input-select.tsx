import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

type InputSelectOption = {
    value: string | number,
    label: string,
}

type InputSelectProps = {
    options: InputSelectOption[],
    onChange: (value: string) => void,
    defaultValue: string,
    placeholder: string,
    value?: string,
};

export const InputSelect = ({ options, onChange, defaultValue, placeholder, value }: InputSelectProps) => {
    return <Select onValueChange={onChange} defaultValue={defaultValue} value={value}>
        <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
            <SelectGroup>
                {
                    options.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>)
                }
            </SelectGroup>
        </SelectContent>
    </Select>
}