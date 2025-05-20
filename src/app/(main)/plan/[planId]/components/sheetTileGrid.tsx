import Link from "next/link";
import SheetTile from "./sheetTile";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function SheetTileGrid({ sheets, planId }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sheets.map((sheet) => (
                <Link key={sheet.id} href={`/plan/${planId}/sheet/${sheet.id}`}>
                    <SheetTile sheet={sheet} />
                </Link>
            ))}
            <Link href={`/plan/${planId}/new-sheet`}>
                <Button size="lg" variant="outline" className="w-full h-full flex items-center justify-center text-lg">
                    <Plus /> Crear hoja
                </Button>
            </Link>
        </div>
    );
}