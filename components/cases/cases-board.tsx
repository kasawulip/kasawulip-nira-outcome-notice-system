"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Clock, ArrowUpRight, CheckCircle2, Phone, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { StatCard } from "@/components/stat-card"
import { CaseStatusBadge, PriorityBadge } from "@/components/status-badge"
import { ServiceIcon } from "@/components/service-icon"
import { serviceName, formatDate, type NoticeRecord, type CaseStatus } from "@/lib/nira"
import { MOCK_NOTICES } from "@/lib/mock-notices"

const ACTION_STATUSES: CaseStatus[] = [
  "Awaiting Client Action",
  "Awaiting NIRA Action",
  "Under Review",
  "Escalated",
]

function daysUntil(dateStr?: string) {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

function CaseRow({ notice, onResolve }: { notice: NoticeRecord; onResolve: (id: string) => void }) {
  const days = daysUntil(notice.expectedCompletion)
  const overdue = days !== null && days < 0
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <ServiceIcon service={notice.service} className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/register/${notice.id}`}
              className="truncate font-medium text-foreground hover:text-primary hover:underline"
            >
              {notice.clientName}
            </Link>
            <span className="font-mono text-xs text-muted-foreground">{notice.noticeNumber}</span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{serviceName(notice.service)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CaseStatusBadge status={notice.caseStatus} />
            <PriorityBadge priority={notice.priority} />
            {notice.expectedCompletion ? (
              <span
                className={
                  "inline-flex items-center gap-1 text-xs " +
                  (overdue ? "text-destructive" : "text-muted-foreground")
                }
              >
                <Clock className="size-3" aria-hidden="true" />
                {overdue
                  ? `Overdue by ${Math.abs(days!)}d`
                  : days === 0
                    ? "Due today"
                    : `Due in ${days}d (${formatDate(notice.expectedCompletion)})`}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        <Button variant="outline" size="sm" onClick={() => toast.info(`Calling ${notice.clientName}`)}>
          <Phone data-icon="inline-start" />
          Contact
        </Button>
        <Button size="sm" onClick={() => onResolve(notice.id)}>
          <CheckCircle2 data-icon="inline-start" />
          Resolve
        </Button>
      </div>
    </div>
  )
}

export function CasesBoard() {
  const [resolved, setResolved] = useState<string[]>([])

  const cases = useMemo(
    () => MOCK_NOTICES.filter((n) => ACTION_STATUSES.includes(n.caseStatus) && !resolved.includes(n.id)),
    [resolved],
  )

  const handleResolve = (id: string) => {
    setResolved((prev) => [...prev, id])
    toast.success("Case marked as resolved")
  }

  const overdue = cases.filter((n) => {
    const d = daysUntil(n.expectedCompletion)
    return d !== null && d < 0
  }).length
  const high = cases.filter((n) => n.priority === "High").length
  const escalated = cases.filter((n) => n.caseStatus === "Escalated").length

  const byPriority = (p: string) => cases.filter((n) => n.priority === p)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open cases" value={cases.length} icon={AlertTriangle} tone="default" />
        <StatCard label="High priority" value={high} icon={ArrowUpRight} tone="danger" />
        <StatCard label="Overdue" value={overdue} icon={Clock} tone="warning" />
        <StatCard label="Escalated" value={escalated} icon={RefreshCw} tone="default" />
      </div>

      {cases.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CheckCircle2 />
                </EmptyMedia>
                <EmptyTitle>All caught up</EmptyTitle>
                <EmptyDescription>There are no cases requiring action right now.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        (["High", "Medium", "Low"] as const).map((priority) => {
          const items = byPriority(priority)
          if (items.length === 0) return null
          return (
            <Card key={priority}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PriorityBadge priority={priority} />
                  <span className="text-muted-foreground text-sm font-normal">
                    {items.length} case{items.length === 1 ? "" : "s"}
                  </span>
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="flex flex-col gap-3 pt-4">
                {items.map((n) => (
                  <CaseRow key={n.id} notice={n} onResolve={handleResolve} />
                ))}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
