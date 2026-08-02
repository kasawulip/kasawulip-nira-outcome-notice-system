import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { AdminPanel } from "@/components/admin/admin-panel"

export const metadata: Metadata = {
  title: "Administration | NIRA Outcome Notices",
}

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Administration"
        description="Manage offices, officers, notification templates, and system rules."
      />
      <AdminPanel />
    </div>
  )
}
