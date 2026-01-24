import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

type InputSelectOption = {
    value: string | number,
    label: string,
}

type InputSelectProps = {
    options: InputSelectOption[],
    onChange: (value: string) => void,
    placeholder: string,
    value?: string | null,
};

export const InputSelect = ({ options, onChange, placeholder, value }: InputSelectProps) => {
    return <Select onValueChange={onChange} value={value ?? ""}>
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