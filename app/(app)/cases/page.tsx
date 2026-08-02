import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { CasesBoard } from "@/components/cases/cases-board"

export const metadata: Metadata = {
  title: "Cases Requiring Action | NIRA Outcome Notices",
}

export default function CasesPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Cases Requiring Action"
        description="Outcome notices awaiting client response, NIRA follow-up, or escalation."
      />
      <CasesBoard />
    </div>
  )
}
