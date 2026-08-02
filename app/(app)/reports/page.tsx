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
        title="Reports & Analytics"
        description="Operational insight into notice volume, delivery reliability, and case resolution."
      />
      <ReportsDashboard />
    </div>
  )
}
