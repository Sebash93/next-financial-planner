import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function DataDisplay({ title, description, value, children }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                    {value}
                </span>
            </CardContent>
            <CardFooter>
                {children}
            </CardFooter>
        </Card>
    );
}