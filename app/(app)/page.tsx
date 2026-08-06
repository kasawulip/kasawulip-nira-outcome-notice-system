import type { Metadata } from "next"
import { RoleLanding } from "@/components/dashboard/role-landing"

export const metadata: Metadata = {
  title: "Dashboard | NIRA Client Services",
  description: "Your NIRA Client Services Outcome Notice workspace.",
}

export default function DashboardPage() {
  return <RoleLanding />
}
