"use client"

import { FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { RegisterTable } from "@/components/register/register-table"
import { useScopedNotices } from "@/components/data-store-context"
import { useSession } from "@/components/session-context"
import { ALL_DISTRICTS } from "@/lib/nira"

export default function RegisterPage() {
  const notices = useScopedNotices()
  const { account } = useSession()
  const scopeLabel =
    !account || account.district === ALL_DISTRICTS ? "All districts" : account.district

  const delivered = notices.filter((n) => n.smsStatus === "Delivered").length
  const pending = notices.filter(
    (n) => n.smsStatus === "Sending" || n.smsStatus === "Queued" || n.smsStatus === "Pending",
  ).length
  const failed = notices.filter((n) => n.smsStatus === "Failed" || n.emailStatus === "Failed").length

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Notice Register"
        description={`Every outcome notice issued for ${scopeLabel}. Search, filter, and open any record for its full audit trail.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total notices" value={notices.length} icon={FileText} hint={scopeLabel} />
        <StatCard label="Delivered" value={delivered} icon={CheckCircle2} tone="success" hint="Confirmed to client" />
        <StatCard label="In progress" value={pending} icon={Clock} tone="warning" hint="Queued or sending" />
        <StatCard label="Failed delivery" value={failed} icon={AlertTriangle} tone="danger" hint="Needs follow-up" />
      </div>

      <RegisterTable notices={notices} />
    </div>
  )
}
