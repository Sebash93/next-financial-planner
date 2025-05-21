"use client"

import Link from "next/link";
import SheetTile from "./sheetTile";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSheetQuery } from "@/queries/sheet.queries";
import AlertEmpty from "@/components/custom/alert-empty";

type SheetTileGridProps = {
    planId: string;
}

export const SheetTileGrid = ({ planId }: SheetTileGridProps) => {
    const { data: sheets, isLoading } = useSheetQuery(planId);
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="animate-pulse bg-gray-200 h-32 rounded-md" />
                ))}
            </div>
        );
    }
    if (sheets?.length) {
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
    return <AlertEmpty title="Tu plan no tiene hojas">
        <div className="flex flex-col items-center">
            Parece que aún no has creado tu primera hoja en este plan.
            <Link href={`/plan/${planId}/new-sheet`} >
                <Button className="mt-4" >
                    <Plus /> Crear hoja
                </Button>
            </Link>
        </div>
    </AlertEmpty>
}