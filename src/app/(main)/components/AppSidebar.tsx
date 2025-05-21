
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { SidebarPlanGroupWithProvider } from "./SidebarPlanGroup"
import { Wallet } from "lucide-react"
import Link from "next/link"

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarPlanGroupWithProvider />
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