
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { SidebarPlanGroupWithProvider } from "./SidebarPlanGroup"
import { Calculator, ChartSpline, Wallet } from "lucide-react"
import Link from "next/link"

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarPlanGroupWithProvider />
                <SidebarGroup>
                    <SidebarGroupLabel>Reportes</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href={`/report`}>
                                        <ChartSpline />
                                        <span>Reportes</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                    <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href={`/tools/salary-calculator`}>
                                        <Calculator />
                                        <span>Calculadora Salarial</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
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