import { Card, CardContent, CardDescription, CardHeader } from "../ui/card"

type TileProps = {
    title: string
    description?: string
    badge?: React.ReactNode
    amount?: string
}

export const Tile = ({ title, description, badge, amount }: TileProps) => {
    return <Card>
        <CardHeader className="pb-0">
            <div className="flex justify-between">
                <div className="text-muted-foreground text-sm">{amount}</div>
                <div className="inline-block">
                    {badge}
                </div>
            </div>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
            <div className="text-xl font-bold tracking-tight">
                {title}
            </div>
        </CardContent>
    </Card>
}