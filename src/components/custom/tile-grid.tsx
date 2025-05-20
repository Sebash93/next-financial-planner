import Link from "next/link"

type TileList = {
    id: number
    title: string
    href: string
}

type TileGridProps = {
    list: TileList[]
}

export const TileGrid = ({ list }: TileGridProps) => {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {list.map((tile) => (
            <Link key={tile.id} href={tile.href}>
                {tile.title}
            </Link>
        ))}
    </div>
}