"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  Users,
  Building2,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  Send,
  BarChart3,
  Settings,
  TriangleAlert,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatCard } from "@/components/stat-card"
import { PageHeader } from "@/components/page-header"
import { useRole } from "@/components/role-context"
import { OFFICES, OFFICERS } from "@/lib/nira"
import { MOCK_NOTICES } from "@/lib/mock-notices"

const OPEN_STATUSES = ["Awaiting Client Action", "Awaiting NIRA Action", "Under Review", "Escalated"]

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

export function AdminDashboard() {
  const { user } = useRole()

  const stats = useMemo(() => {
    const total = MOCK_NOTICES.length
    const delivered = MOCK_NOTICES.filter((n) => n.smsStatus === "Delivered").length
    const open = MOCK_NOTICES.filter((n) => OPEN_STATUSES.includes(n.caseStatus)).length
    const escalated = MOCK_NOTICES.filter((n) => n.caseStatus === "Escalated").length
    return { total, delivered, open, escalated }
  }, [])

  // Officer performance derived from mock notices, padded for a fuller table.
  const officers = useMemo(() => {
    return OFFICERS.map((entry, i) => {
      const [name, title] = entry.split(" — ")
      const issued = MOCK_NOTICES.filter((n) => n.officer === name).length + 18 + i * 7
      const resolved = Math.round(issued * (0.78 + (i % 3) * 0.05))
      const rate = Math.round((resolved / issued) * 100)
      return { name, title, issued, resolved, rate }
    }).sort((a, b) => b.issued - a.issued)
  }, [])

  const officeData = useMemo(() => {
    return OFFICES.map((office, i) => ({
      office: office.replace(" District Office", "").replace(" Office", "").replace("NIRA ", ""),
      notices: MOCK_NOTICES.filter((n) => n.office === office).length + 24 + i * 11,
      fill: `var(--chart-${(i % 5) + 1})`,
    }))
  }, [])

  const officeConfig: ChartConfig = { notices: { label: "Notices", color: "var(--chart-1)" } }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Administrator overview — service delivery, officer performance, and system health across all NIRA offices."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/reports" />}>
              <BarChart3 data-icon="inline-start" />
              Full reports
            </Button>
            <Button nativeButton={false} render={<Link href="/admin" />}>
              <Settings data-icon="inline-start" />
              Administration
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Notices issued (all offices)" value={stats.total} icon={FileText} />
        <StatCard label="Delivered" value={stats.delivered} icon={Send} tone="success" />
        <StatCard label="Open cases" value={stats.open} icon={Activity} tone="warning" />
        <StatCard label="Escalated" value={stats.escalated} icon={TriangleAlert} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Officer performance */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Officer performance</CardTitle>
            <CardDescription>Notices issued and resolution rate for the current period.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Officer</TableHead>
                  <TableHead className="text-right">Issued</TableHead>
                  <TableHead className="text-right">Resolved</TableHead>
                  <TableHead className="w-40">Resolution rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {officers.map((o) => (
                  <TableRow key={o.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                            {initials(o.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium">{o.name}</span>
                          <span className="text-xs text-muted-foreground">{o.title}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{o.issued}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{o.resolved}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={o.rate} className="h-2" />
                        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{o.rate}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System health */}
        <Card>
          <CardHeader>
            <CardTitle>System health</CardTitle>
            <CardDescription>Live service and channel status.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[
              { label: "SMS gateway", status: "Operational", tone: "success" as const, value: 99 },
              { label: "Email delivery", status: "Operational", tone: "success" as const, value: 97 },
              { label: "PDF generation", status: "Operational", tone: "success" as const, value: 100 },
              { label: "ID verification API", status: "Degraded", tone: "warning" as const, value: 82 },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{s.label}</span>
                  <Badge
                    variant="outline"
                    className={
                      s.tone === "success"
                        ? "border-transparent bg-success/12 text-success"
                        : "border-transparent bg-warning/15 text-warning-foreground"
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
                <Progress value={s.value} className="h-1.5" />
              </div>
            ))}
            <Separator />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success" />
              All data encrypted; last security audit passed 4 days ago.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Notices by office */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notices by office</CardTitle>
            <CardDescription>Volume issued across NIRA service points.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={officeConfig} className="h-[260px] w-full">
              <BarChart accessibilityLayer data={officeData} margin={{ left: -12, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="office" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="notices" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Management shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle>Management</CardTitle>
            <CardDescription>Administrative controls.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[
              { href: "/admin", icon: Users, label: "Officers & roles", hint: `${OFFICERS.length} accounts` },
              { href: "/admin", icon: Building2, label: "Offices", hint: `${OFFICES.length} service points` },
              { href: "/admin", icon: FileText, label: "Notice templates", hint: "SMS & email" },
              { href: "/reports", icon: BarChart3, label: "Reports & analytics", hint: "Trends & exports" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/50"
              >
                <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <item.icon className="size-4" />
                </span>
                <div className="flex flex-1 flex-col leading-tight">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.hint}</span>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
