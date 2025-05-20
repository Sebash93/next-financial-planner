import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/AppSidebar"

export default function MainLayout({ children }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <div className="w-full">
                <SidebarTrigger />
                {children}
            </div>
        </SidebarProvider>
    );
}