import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

type DataDisplayProps = {
    title: string;
    description: string;
    value?: string | number;
    children?: React.ReactNode;
}

export default function DataDisplay({ title, description, value, children }: DataDisplayProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            {value && <CardContent>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                    {value}
                </span>
            </CardContent>}
            <CardFooter>
                {children}
            </CardFooter>
        </Card>
    );
}