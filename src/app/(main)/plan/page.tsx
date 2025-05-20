import Page from "@/components/custom/page";
import { TileGrid } from "@/components/custom/tile-grid";
import { Plan } from "prisma/prisma-client";

export default async function PlanPage() {
    const plans: Plan[] = await fetch("http://localhost:3000/api/plan").then((res) => res.json());
    const plansList = plans.map((plan) => {
        return {
            id: plan.id,
            title: plan.name,
            href: `/plan/${plan.id}`,
        }
    });
    return <Page title="Planes">
        <TileGrid list={plansList} />
    </Page>
}