import AlertEmpty from "@/components/custom/alert-empty";
import Page from "@/components/custom/page";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import SheetTileGrid from "./components/sheetTileGrid";

export default async function PlanPage({ params }) {
    const { planId } = await params;
    const plan = await fetch(`http://localhost:3000/api/plan/${planId}`).then((res) => res.json());
    const sheets = await fetch(`http://localhost:3000/api/sheet?planId=${planId}`).then((res) => res.json());
    return (
        <Page title={plan.name}>
            <SheetTileGrid sheets={sheets} planId={planId} />
            <AlertEmpty title="Tu plan no tiene hojas">
                <div className="flex flex-col items-center">
                    Parece que aún no has creado tu primera hoja en este plan.
                    <Link href={`/plan/${planId}/new-sheet`} >
                        <Button className="mt-4" >
                            <Plus /> Crear hoja
                        </Button>
                    </Link>
                </div>
            </AlertEmpty>
        </Page>
    );
}