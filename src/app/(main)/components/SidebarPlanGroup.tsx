import { SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { CalendarRange, Plus } from "lucide-react"
import Link from "next/link"

export default async function SidebarPlanGroup() {
    const plans = await fetch("http://localhost:3000/api/plan").then((res) => res.json());
    return <SidebarGroup title="Plan">
        <SidebarGroupLabel>Tus Planes</SidebarGroupLabel>
        <SidebarGroupAction title="Add Project">
            <Link href="/new-plan" >
                <Plus className="w-4 h-4" /> <span className="sr-only">Add Project</span>
            </Link>
        </SidebarGroupAction>
        <SidebarGroupContent>
            <SidebarMenu>
                {plans.map((plans) => (
                    <SidebarMenuItem key={plans.id}>
                        <SidebarMenuButton asChild>
                            <Link href={`/plan/${plans.id}`}>
                                <CalendarRange />
                                <span>{plans.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroupContent>
    </SidebarGroup>
}