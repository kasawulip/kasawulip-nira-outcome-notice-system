"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { AdminPanel } from "@/components/admin/admin-panel"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useSession } from "@/components/session-context"

export default function AdminPage() {
  const { account, ready } = useSession()
  const router = useRouter()
  const isAdmin = account?.role === "systems-admin"

  useEffect(() => {
    if (ready && account && !isAdmin) router.replace("/")
  }, [ready, account, isAdmin, router])

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-6">
        <Empty className="rounded-lg border border-border bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldAlert />
            </EmptyMedia>
            <EmptyTitle>Administrator access only</EmptyTitle>
            <EmptyDescription>
              This area is restricted to Systems Admin accounts. Redirecting you to the home screen.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Administration"
        description="Manage officer accounts and districts, monitor system health, and control delivery channels."
      />
      <AdminPanel />
    </div>
  )
}
