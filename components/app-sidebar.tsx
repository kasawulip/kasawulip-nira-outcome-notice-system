"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  Send,
  AlertTriangle,
  BarChart3,
  Settings,
  LifeBuoy,
  LogOut,
  ChevronsUpDown,
} from "lucide-react"

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
import { useRole, type Role } from "@/components/role-context"

interface NavItem {
  title: string
  href: string
  icon: typeof LayoutDashboard
  badge?: string
  roles: Role[]
}

const NAV: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["officer", "admin"] },
  { title: "New Notice", href: "/new-notice", icon: FilePlus2, roles: ["officer"] },
  { title: "Notice Register", href: "/register", icon: ClipboardList, roles: ["officer", "admin"] },
  { title: "Delivery Status", href: "/delivery", icon: Send, roles: ["officer", "admin"] },
  { title: "Cases Requiring Action", href: "/cases", icon: AlertTriangle, badge: "7", roles: ["officer", "admin"] },
  { title: "Reports", href: "/reports", icon: BarChart3, roles: ["officer", "admin"] },
  { title: "Administration", href: "/admin", icon: Settings, roles: ["admin"] },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { role, user } = useRole()

  const items = NAV.filter((item) => item.roles.includes(role))

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  function handleLogout() {
    if (typeof window !== "undefined") window.localStorage.removeItem("nira-role")
    router.push("/login")
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-1 py-2">
          <NiraLogo />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">NIRA</span>
            <span className="truncate text-xs text-sidebar-foreground/70">Outcome Notices</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{role === "admin" ? "Administration" : "Operations"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
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
            <SidebarMenuButton size="lg" tooltip="Account">
              <Avatar className="size-8 rounded-md">
                <AvatarFallback className="rounded-md bg-sidebar-accent text-xs text-sidebar-accent-foreground">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col text-left">
                <span className="truncate text-sm font-medium">{user.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{user.title}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-60" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
