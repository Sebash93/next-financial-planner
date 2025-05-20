type TileProps = {
    title: string
    description?: string
}

export const Tile = ({ title, description }: TileProps) => {
    return <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col items-center p-6">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            {title}
        </h4>
        <p className="leading-7">
            {description}
        </p>
    </div>
}