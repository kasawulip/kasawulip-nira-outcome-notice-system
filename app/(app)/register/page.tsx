import type { Metadata } from "next"
import { FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { RegisterTable } from "@/components/register/register-table"
import { MOCK_NOTICES } from "@/lib/mock-notices"

export const metadata: Metadata = {
  title: "Notice Register | NIRA Client Services",
  description: "Searchable register of every outcome notice issued at the office.",
}

export default function RegisterPage() {
  const notices = MOCK_NOTICES
  const delivered = notices.filter((n) => n.smsStatus === "Delivered").length
  const pending = notices.filter((n) => n.smsStatus === "Sending" || n.smsStatus === "Queued" || n.smsStatus === "Pending").length
  const failed = notices.filter((n) => n.smsStatus === "Failed" || n.emailStatus === "Failed").length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notice Register"
        description="Every outcome notice issued from this office. Search, filter, and open any record for its full audit trail."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total notices" value={notices.length} icon={FileText} hint="This office, all time" />
        <StatCard label="Delivered" value={delivered} icon={CheckCircle2} tone="success" hint="Confirmed to client" />
        <StatCard label="In progress" value={pending} icon={Clock} tone="warning" hint="Queued or sending" />
        <StatCard label="Failed delivery" value={failed} icon={AlertTriangle} tone="danger" hint="Needs follow-up" />
      </div>

      <RegisterTable notices={notices} />
    </div>
  )
}
