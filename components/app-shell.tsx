"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { SyncBridge } from "@/components/sync-bridge"
import { Spinner } from "@/components/ui/spinner"
import { useSession } from "@/components/session-context"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { account, ready } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (ready && !account) router.replace("/login")
  }, [ready, account, router])

  if (!ready || !account) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="size-6 text-primary" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <SyncBridge />
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <AppHeader />
        {/* pb accounts for the mobile bottom tab bar */}
        <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  )
}
