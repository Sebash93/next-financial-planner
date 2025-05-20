import Link from "next/link";
import SheetTile from "./sheetTile";

export default function SheetTileGrid({ sheets, planId }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sheets.map((sheet) => (
                <Link key={sheet.id} href={`/plan/${planId}/sheet/${sheet.id}`}>
                    <SheetTile sheet={sheet} />
                </Link>
            ))}
        </div>
    );
}