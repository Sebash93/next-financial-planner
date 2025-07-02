"use client"

import { SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { ReactQueryProvider } from "@/providers/react-query-provider"
import { usePlanQuery } from "@/queries/plan.queries"
import { CalendarRange, Plus } from "lucide-react"
import Link from "next/link"

const SidebarPlanGroup = () => {
    const { data: plans, isLoading } = usePlanQuery()
    if (isLoading) return <div className="flex flex-col gap-2 justify-center p-2">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-4" />
    </div>
    return <>
        <SidebarGroupLabel>Tus Planes</SidebarGroupLabel>
        <SidebarGroupAction title="Add Project">
            <Link href="/new-plan" >
                <Plus className="w-4 h-4" /> <span className="sr-only">Add Project</span>
            </Link>
        </SidebarGroupAction>
        <SidebarGroupContent>
            <SidebarMenu>
                {plans?.length ? plans.map((plan) => (
                    <SidebarMenuItem key={plan.id}>
                        <SidebarMenuButton asChild>
                            <Link href={`/plan/${plan.id}`}>
                                <CalendarRange />
                                <span>{plan.name}</span>
                            </Link>
                        </SidebarMenuButton>
                        {plan.Sheet.map((sheet) => {
                            return <SidebarMenuSub key={sheet.id}>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href={`/plan/${plan.id}/sheet/${sheet.id}`}>
                                            <span>{sheet.name}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        })}
                    </SidebarMenuItem>
                )) : null}
            </SidebarMenu>
        </SidebarGroupContent>
    </>
}

export const SidebarPlanGroupWithProvider = () => {
    return <ReactQueryProvider>
        <SidebarPlanGroup />
    </ReactQueryProvider>
}