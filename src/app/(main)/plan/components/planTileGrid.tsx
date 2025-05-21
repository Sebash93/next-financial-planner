"use client"

import { TileGrid } from "@/components/custom/tile-grid"
import { usePlanQuery } from "@/queries/plan.queries"

export const PlanTileGrid = () => {
    const { data: plans } = usePlanQuery()
    const plansList = plans?.length ? plans.map((plan) => {
        return {
            id: plan.id,
            title: plan.name,
            href: `/plan/${plan.id}`,
        }
    }) : [];
    return <TileGrid list={plansList} />
}