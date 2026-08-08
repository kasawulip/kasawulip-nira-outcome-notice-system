"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { LifeBuoy, LogOut } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NiraLogo } from "@/components/nira-logo"
import { ROLE_LABEL } from "@/lib/nira"
import { useSession } from "@/components/session-context"
import { useScopedNotices } from "@/components/data-store-context"
import { navForRole } from "@/components/nav-config"

const OPEN_STATUSES = ["Awaiting Client Action", "Awaiting NIRA Action", "Under Review", "Issued"]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { account, role, signOut } = useSession()
  const scoped = useScopedNotices()
  const items = navForRole(role)

  const openCases = scoped.filter((n) => OPEN_STATUSES.includes(n.caseStatus)).length

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  function handleSignOut() {
    signOut()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-1 py-2">
          <NiraLogo />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">Central Region</span>
            <span className="truncate text-xs text-sidebar-foreground/70">Outcome Notices</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{role ? ROLE_LABEL[role] : "Operations"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {item.href === "/cases" && openCases > 0 ? (
                    <SidebarMenuBadge>{openCases}</SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Help and Support">
              <LifeBuoy />
              <span>Help and Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={account?.name ?? "Account"}>
              <Avatar className="size-8 rounded-md">
                <AvatarFallback className="rounded-md bg-sidebar-accent text-xs text-sidebar-accent-foreground">
                  {account?.initials ?? "NA"}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col text-left">
                <span className="truncate text-sm font-medium">{account?.name ?? "Not signed in"}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{account?.district}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign out" onClick={handleSignOut}>
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
