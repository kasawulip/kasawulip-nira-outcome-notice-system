import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { NetworkProvider } from "@/components/network-context"
import { RoleProvider } from "@/components/role-context"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <NetworkProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="min-w-0">
            <AppHeader />
            <div className="min-w-0 flex-1">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </NetworkProvider>
    </RoleProvider>
  )
}
