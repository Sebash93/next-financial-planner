"use client"

import { SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { ReactQueryProvider } from "@/providers/react-query-provider"
import { usePlanQuery } from "@/queries/plan.queries"
import { CalendarRange, Plus } from "lucide-react"
import Link from "next/link"

const SidebarPlanGroup = () => {
    const { data: plans } = usePlanQuery()
    return <SidebarGroup title="Plan">
        <SidebarGroupLabel>Tus Planes</SidebarGroupLabel>
        <SidebarGroupAction title="Add Project">
            <Link href="/new-plan" >
                <Plus className="w-4 h-4" /> <span className="sr-only">Add Project</span>
            </Link>
        </SidebarGroupAction>
        <SidebarGroupContent>
            <SidebarMenu>
                {plans?.length ? plans.map((plans) => (
                    <SidebarMenuItem key={plans.id}>
                        <SidebarMenuButton asChild>
                            <Link href={`/plan/${plans.id}`}>
                                <CalendarRange />
                                <span>{plans.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )) : null}
            </SidebarMenu>
        </SidebarGroupContent>
    </SidebarGroup>
}

export const SidebarPlanGroupWithProvider = () => {
    return <ReactQueryProvider>
        <SidebarPlanGroup />
    </ReactQueryProvider>
}