import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import SidebarPlanGroup from "./SidebarPlanGroup"
import { Wallet } from "lucide-react"
import Link from "next/link"

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarPlanGroup />
                <SidebarGroup>
                    <SidebarGroupLabel>Configuración</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href={`/bucket`}>
                                        <Wallet />
                                        <span>Bolsillos</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}