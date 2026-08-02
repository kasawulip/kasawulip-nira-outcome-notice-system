"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Mail,
  RefreshCw,
  Send,
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { StatCard } from "@/components/stat-card"
import { DeliveryStatusBadge } from "@/components/status-badge"
import { ServiceIcon } from "@/components/service-icon"
import { serviceName, formatDateTime, type NoticeRecord } from "@/lib/nira"
import { MOCK_NOTICES } from "@/lib/mock-notices"

function DeliveryRow({
  notice,
  channel,
  status,
  onRetry,
}: {
  notice: NoticeRecord
  channel: "SMS" | "Email"
  status: string
  onRetry: () => void
}) {
  const Icon = channel === "SMS" ? MessageSquare : Mail
  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <Link href={`/register/${notice.id}`} className="text-sm font-medium text-foreground hover:underline">
            {notice.clientName}
          </Link>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ServiceIcon service={notice.service} className="size-3.5" />
            {serviceName(notice.service)} · {channel === "SMS" ? notice.phone : notice.email}
          </span>
          <span className="text-xs text-muted-foreground">{formatDateTime(notice.dateTime)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-11 sm:pl-0">
        <DeliveryStatusBadge status={status} />
        {status === "Failed" ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw data-icon="inline-start" />
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function DeliveryMonitor() {
  const [resolved, setResolved] = useState<Set<string>>(new Set())

  const stats = useMemo(() => {
    const sms = MOCK_NOTICES.filter((n) => n.deliveryMethod !== "print")
    const delivered = sms.filter((n) => n.smsStatus === "Delivered").length
    const failed = MOCK_NOTICES.filter((n) => n.smsStatus === "Failed" || n.emailStatus === "Failed").length
    const pending = sms.filter((n) => ["Pending", "Queued", "Sent"].includes(n.smsStatus)).length
    const rate = sms.length ? Math.round((delivered / sms.length) * 100) : 0
    return { total: sms.length, delivered, failed, pending, rate }
  }, [])

  const failedItems = MOCK_NOTICES.flatMap((n) => {
    const out: { key: string; notice: NoticeRecord; channel: "SMS" | "Email"; status: string }[] = []
    if (n.smsStatus === "Failed") out.push({ key: `${n.id}-sms`, notice: n, channel: "SMS", status: "Failed" })
    if (n.emailStatus === "Failed") out.push({ key: `${n.id}-email`, notice: n, channel: "Email", status: "Failed" })
    return out
  }).filter((item) => !resolved.has(item.key))

  const pendingItems = MOCK_NOTICES.filter((n) =>
    ["Pending", "Queued", "Sent"].includes(n.smsStatus),
  ).map((n) => ({ key: `${n.id}-sms`, notice: n, channel: "SMS" as const, status: n.smsStatus }))

  function retry(key: string, name: string) {
    setResolved((prev) => new Set(prev).add(key))
    toast.success("Delivery retried", { description: `Re-attempting delivery for ${name}.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Messages sent" value={stats.total} icon={Send} hint="SMS + email today" />
        <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} tone="success" />
        <StatCard label="In progress" value={stats.pending} icon={Clock} tone="warning" />
        <StatCard label="Failed" value={stats.failed} icon={AlertTriangle} tone="danger" hint="Awaiting retry" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall delivery rate</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-foreground">{stats.rate}%</span>
            <span className="text-sm text-muted-foreground">
              {stats.delivered} of {stats.total} confirmed delivered
            </span>
          </div>
          <Progress value={stats.rate} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery queue</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="failed">
            <TabsList>
              <TabsTrigger value="failed">Failed ({failedItems.length})</TabsTrigger>
              <TabsTrigger value="pending">In progress ({pendingItems.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="failed">
              {failedItems.length ? (
                <div className="flex flex-col divide-y divide-border">
                  {failedItems.map((item) => (
                    <DeliveryRow
                      key={item.key}
                      notice={item.notice}
                      channel={item.channel}
                      status={item.status}
                      onRetry={() => retry(item.key, item.notice.clientName)}
                    />
                  ))}
                </div>
              ) : (
                <Empty className="border-0">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CheckCircle2 />
                    </EmptyMedia>
                    <EmptyTitle>No failed deliveries</EmptyTitle>
                    <EmptyDescription>All notices have been delivered or are in progress.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </TabsContent>
            <TabsContent value="pending">
              {pendingItems.length ? (
                <div className="flex flex-col divide-y divide-border">
                  {pendingItems.map((item) => (
                    <DeliveryRow
                      key={item.key}
                      notice={item.notice}
                      channel={item.channel}
                      status={item.status}
                      onRetry={() => retry(item.key, item.notice.clientName)}
                    />
                  ))}
                </div>
              ) : (
                <Empty className="border-0">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Clock />
                    </EmptyMedia>
                    <EmptyTitle>Nothing in progress</EmptyTitle>
                    <EmptyDescription>There are no queued or sending messages right now.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
