"use client"

import { useMemo, useState } from "react"
import { FileText, CheckCircle2, Send, Clock, Download, FileDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { StatCard } from "@/components/stat-card"
import { CaseStatusBadge } from "@/components/status-badge"
import { SERVICES, DISTRICTS, ALL_DISTRICTS, serviceName } from "@/lib/nira"
import { useScopedNotices } from "@/components/data-store-context"
import { useSession } from "@/components/session-context"
import { computeReportStats } from "@/lib/report-stats"
import { noticesToCsv, downloadTextFile, timestampSlug } from "@/lib/export-csv"
import { exportReportPdf } from "@/lib/export-pdf"

const shortLabel = (name: string) => name.split(/\s*[—-]\s*/)[0].trim()

export function ReportsDashboard() {
  const scoped = useScopedNotices()
  const { account } = useSession()
  const isAdmin = account?.role === "systems-admin"

  // Admin-only filters. Staff are locked to their own district.
  const [districtFilter, setDistrictFilter] = useState<string>("all")
  const [serviceFilter, setServiceFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    return scoped.filter((n) => {
      if (isAdmin && districtFilter !== "all" && n.office !== districtFilter) return false
      if (serviceFilter !== "all" && n.service !== serviceFilter) return false
      return true
    })
  }, [scoped, isAdmin, districtFilter, serviceFilter])

  const stats = useMemo(() => computeReportStats(filtered), [filtered])

  const scopeLabel = isAdmin
    ? districtFilter === "all"
      ? ALL_DISTRICTS
      : districtFilter
    : account?.district ?? ALL_DISTRICTS
  const serviceLabel = serviceFilter === "all" ? "All services" : serviceName(serviceFilter)

  const serviceChart = useMemo(
    () =>
      stats.byService.slice(0, 8).map((s, i) => ({
        service: shortLabel(s.label),
        count: s.count,
        fill: `var(--chart-${(i % 5) + 1})`,
      })),
    [stats.byService],
  )

  const serviceConfig = useMemo(() => {
    const cfg: ChartConfig = { count: { label: "Notices" } }
    serviceChart.forEach((s, i) => {
      cfg[s.service] = { label: s.service, color: `var(--chart-${(i % 5) + 1})` }
    })
    return cfg
  }, [serviceChart])

  function handleCsv() {
    if (filtered.length === 0) {
      toast.error("No notices in the current scope to export.")
      return
    }
    downloadTextFile(`nira-report-${timestampSlug()}.csv`, noticesToCsv(filtered))
    toast.success(`Exported ${filtered.length} notice${filtered.length === 1 ? "" : "s"} to CSV.`)
  }

  function handlePdf() {
    if (filtered.length === 0) {
      toast.error("No notices in the current scope to export.")
      return
    }
    exportReportPdf(
      stats,
      { scopeLabel, serviceFilter: serviceLabel, generatedBy: account?.name ?? "Central Region Officer" },
      `nira-report-${timestampSlug()}.pdf`,
    )
    toast.success("PDF report generated.")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Scope + filters + export */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {isAdmin ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">District</label>
              <Select value={districtFilter} onValueChange={(v) => setDistrictFilter(v ?? "all")}>
                <SelectTrigger className="w-full sm:w-[220px]" aria-label="Filter by district">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All districts (national)</SelectItem>
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d.id} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">District</span>
              <span className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm font-medium">
                {account?.district}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Service category</label>
            <Select value={serviceFilter} onValueChange={(v) => setServiceFilter(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-[220px]" aria-label="Filter by service category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {SERVICES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCsv} className="flex-1 lg:flex-none">
            <Download data-icon="inline-start" />
            CSV
          </Button>
          <Button onClick={handlePdf} className="flex-1 lg:flex-none">
            <FileDown data-icon="inline-start" />
            PDF
          </Button>
        </div>
      </div>

      {/* Key figures */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total notices" value={stats.total} icon={FileText} hint={scopeLabel} />
        <StatCard label="Resolution rate" value={`${stats.resolutionRate}%`} icon={CheckCircle2} tone="success" hint={`${stats.resolved} resolved`} />
        <StatCard label="SMS delivery rate" value={`${stats.deliveryRate}%`} icon={Send} tone="default" hint={`${stats.delivered} delivered`} />
        <StatCard label="Open cases" value={stats.open} icon={Clock} tone="warning" hint="Awaiting action" />
      </div>

      {stats.total === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No notices match the current scope and filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* By service */}
          <Card className={isAdmin ? "" : "lg:col-span-2"}>
            <CardHeader>
              <CardTitle>Notices by service</CardTitle>
              <CardDescription>{serviceLabel} · {scopeLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {serviceChart.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No service data.</p>
              ) : (
                <ChartContainer config={serviceConfig} className="h-[300px] w-full">
                  <BarChart data={serviceChart} layout="vertical" accessibilityLayer margin={{ left: 8 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="service"
                      tickLine={false}
                      axisLine={false}
                      width={130}
                      tickMargin={4}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="count" radius={4}>
                      {serviceChart.map((entry) => (
                        <Cell key={entry.service} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* By district (national view only) */}
          {isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle>Notices by district</CardTitle>
                <CardDescription>Distribution across district offices</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0">
                {stats.byDistrict.map((d) => {
                  const pct = stats.total ? Math.round((d.count / stats.total) * 100) : 0
                  return (
                    <div key={d.district} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate text-foreground">{d.district}</span>
                        <span className="shrink-0 font-medium text-muted-foreground">
                          {d.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ) : null}

          {/* By case status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Case status breakdown</CardTitle>
              <CardDescription>Where notices currently stand in their lifecycle</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 pt-0">
              {stats.byStatus.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  <CaseStatusBadge status={s.status} />
                  <span className="text-lg font-semibold tabular-nums text-foreground">{s.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
