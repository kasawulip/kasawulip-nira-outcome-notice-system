import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"

export const metadata: Metadata = {
  title: "Reports | NIRA Outcome Notices",
}

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Reports"
        description="Lightweight, scoped insight into notice volume, delivery, and case resolution. Export to CSV or PDF."
      />
      <ReportsDashboard />
    </div>
  )
}
