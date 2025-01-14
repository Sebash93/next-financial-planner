import { SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import PlanSelector from "./SidebarPlanGroup"
import { CalendarRange, Plus } from "lucide-react"
import Link from "next/link"

/* const plans = [{
    id: "1",
    name: "2025",
},
{
    id: "2",
    name: "Temporal 2025",
}] */

export default async function SidebarPlanGroup() {
    const plans = await fetch("http://localhost:3000/api/plan").then((res) => res.json());
    console.log({ plans })
    return <SidebarGroup title="Plan">
        <SidebarGroupLabel>Tu Plan</SidebarGroupLabel>
        <SidebarGroupAction title="Add Project">
            <Plus /> <span className="sr-only">Add Project</span>
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