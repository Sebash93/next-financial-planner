import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import SidebarPlanGroup from "./SidebarPlanGroup"

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarPlanGroup />
            </SidebarContent>
        </Sidebar>
    )
}