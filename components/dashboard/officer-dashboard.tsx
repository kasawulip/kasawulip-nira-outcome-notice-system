"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
  FilePlus2,
  ClipboardList,
  Send,
  ArrowRight,
  CheckCircle2,
  FileText,
  AlertTriangle,
  CircleCheck,
} from "lucide-react"

import { useRole } from "@/components/role-context"
import { StatCard } from "@/components/stat-card"
import { ServiceIcon } from "@/components/service-icon"
import { CaseStatusBadge, PriorityBadge, DeliveryStatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { MOCK_NOTICES } from "@/lib/mock-notices"
import { serviceName, formatDateTime, SERVICES } from "@/lib/nira"

const OPEN_STATUSES = ["Awaiting Client Action", "Awaiting NIRA Action", "Under Review", "Escalated"]

const serviceIconKey = (id: string) => SERVICES.find((s) => s.id === id)?.icon ?? "ellipsis"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export function OfficerDashboard() {
  const { user } = useRole()

  const data = useMemo(() => {
    const mine = MOCK_NOTICES.filter((n) => n.officer === user.name)
    const source = mine.length ? mine : MOCK_NOTICES.slice(0, 6)
    const openCases = source.filter((n) => OPEN_STATUSES.includes(n.caseStatus))
    const delivered = source.filter((n) => n.smsStatus === "Delivered").length
    const failed = source.filter((n) => n.smsStatus === "Failed" || n.emailStatus === "Failed").length
    const rate = source.length ? Math.round((delivered / source.length) * 100) : 0
    const recent = [...source].sort((a, b) => +new Date(b.dateTime) - +new Date(a.dateTime)).slice(0, 5)
    return { count: source.length, openCases, delivered, failed, rate, recent }
  }, [user.name])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      {/* Welcome band */}
      <section className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-pretty text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.title} &middot; {user.office}
          </p>
        </div>
        <Button size="lg" className="w-full gap-2 md:w-auto" render={<Link href="/new-notice" />}>
          <FilePlus2 data-icon="inline-start" />
          Issue new notice
        </Button>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Notices issued" value={data.count} icon={FileText} hint="Assigned to you" />
        <StatCard label="Open cases" value={data.openCases.length} icon={AlertTriangle} tone="warning" hint="Need follow-up" />
        <StatCard label="Delivered" value={`${data.rate}%`} icon={CheckCircle2} tone="success" hint="SMS delivery rate" />
        <StatCard label="Failed deliveries" value={data.failed} icon={Send} tone={data.failed ? "danger" : "default"} hint="Retry required" />
      </section>

      {/* Two-column body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cases requiring action */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>Cases requiring your action</CardTitle>
              <CardDescription>Outcome notices you issued that are awaiting a next step.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5" render={<Link href="/cases" />}>
              View all
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardHeader>
          <CardContent>
            {data.openCases.length === 0 ? (
              <Empty className="border-none py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CircleCheck />
                  </EmptyMedia>
                  <EmptyTitle>All caught up</EmptyTitle>
                  <EmptyDescription>You have no cases that need attention right now.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.openCases.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/register/${n.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <ServiceIcon name={serviceIconKey(n.service)} className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">{n.clientName}</span>
                        <span className="truncate text-xs text-muted-foreground">{serviceName(n.service)}</span>
                      </div>
                      <div className="hidden items-center gap-2 sm:flex">
                        <PriorityBadge priority={n.priority} />
                        <CaseStatusBadge status={n.caseStatus} />
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start gap-2" render={<Link href="/new-notice" />}>
                <FilePlus2 data-icon="inline-start" />
                Issue new notice
              </Button>
              <Button variant="outline" className="justify-start gap-2" render={<Link href="/register" />}>
                <ClipboardList data-icon="inline-start" />
                Notice register
              </Button>
              <Button variant="outline" className="justify-start gap-2" render={<Link href="/delivery" />}>
                <Send data-icon="inline-start" />
                Delivery status
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent notices</CardTitle>
              <CardDescription>Your latest issued outcomes.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {data.recent.map((n) => (
                  <li key={n.id}>
                    <Link href={`/register/${n.id}`} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{n.clientName}</span>
                        <DeliveryStatusBadge status={n.smsStatus} />
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTime(n.dateTime)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
