"use client"

import { useRole } from "@/components/role-context"
import { OfficerDashboard } from "@/components/dashboard/officer-dashboard"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { Skeleton } from "@/components/ui/skeleton"

export function RoleLanding() {
  const { role, mounted } = useRole()

  if (!mounted) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  return role === "admin" ? <AdminDashboard /> : <OfficerDashboard />
}
