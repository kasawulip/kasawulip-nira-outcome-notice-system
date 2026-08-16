import { FilePlus2, ListChecks, ClipboardList, BarChart3, Settings2, type LucideIcon } from "lucide-react"
import type { Role } from "@/lib/nira"

export interface NavItem {
  href: string
  label: string
  /** Shorter label for the mobile bottom bar. */
  short: string
  icon: LucideIcon
  roles: Role[]
  /** Show in the mobile bottom tab bar. */
  bottom: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "New Notice",
    short: "New",
    icon: FilePlus2,
    roles: ["district-staff", "hq-staff", "systems-admin"],
    bottom: true,
  },
  {
    href: "/register",
    label: "Notice Register",
    short: "Register",
    icon: ListChecks,
    roles: ["district-staff", "hq-staff", "systems-admin"],
    bottom: true,
  },
  {
    href: "/cases",
    label: "Cases",
    short: "Cases",
    icon: ClipboardList,
    roles: ["district-staff", "hq-staff", "systems-admin"],
    bottom: true,
  },
  {
    href: "/reports",
    label: "Reports",
    short: "Reports",
    icon: BarChart3,
    roles: ["district-staff", "hq-staff", "systems-admin"],
    bottom: true,
  },
  {
    href: "/admin",
    label: "Administration",
    short: "Admin",
    icon: Settings2,
    roles: ["systems-admin"],
    bottom: true,
  },
]

export function navForRole(role: Role | null): NavItem[] {
  if (!role) return []
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
