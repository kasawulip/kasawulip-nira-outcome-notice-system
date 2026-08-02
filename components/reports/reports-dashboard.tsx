"use client"

import { useMemo } from "react"
import { TrendingUp, FileText, CheckCircle2, Send } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Line, LineChart } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { StatCard } from "@/components/stat-card"
import { SERVICES } from "@/lib/nira"
import { MOCK_NOTICES } from "@/lib/mock-notices"

const volumeData = [
  { month: "Feb", issued: 182, resolved: 168 },
  { month: "Mar", issued: 214, resolved: 201 },
  { month: "Apr", issued: 198, resolved: 190 },
  { month: "May", issued: 256, resolved: 233 },
  { month: "Jun", issued: 289, resolved: 268 },
  { month: "Jul", issued: 312, resolved: 291 },
]

const volumeConfig = {
  issued: { label: "Issued", color: "var(--chart-1)" },
  resolved: { label: "Resolved", color: "var(--chart-3)" },
} satisfies ChartConfig

const deliveryData = [
  { day: "Mon", rate: 96 },
  { day: "Tue", rate: 98 },
  { day: "Wed", rate: 94 },
  { day: "Thu", rate: 97 },
  { day: "Fri", rate: 99 },
  { day: "Sat", rate: 92 },
  { day: "Sun", rate: 95 },
]

const deliveryConfig = {
  rate: { label: "Delivery rate %", color: "var(--chart-2)" },
} satisfies ChartConfig

const shortLabel = (name: string) => name.split(/\s*[—-]\s*/)[0].trim()

export function ReportsDashboard() {
  const serviceData = useMemo(() => {
    return SERVICES.slice(0, 8).map((s, i) => ({
      service: shortLabel(s.name),
      count: MOCK_NOTICES.filter((n) => n.service === s.id).length + (i % 5) + 2,
      fill: `var(--chart-${(i % 5) + 1})`,
    }))
  }, [])

  const serviceConfig = useMemo(() => {
    const cfg: ChartConfig = {}
    SERVICES.slice(0, 8).forEach((s, i) => {
      const label = shortLabel(s.name)
      cfg[label] = { label, color: `var(--chart-${(i % 5) + 1})` }
    })
    return cfg
  }, [])

  const totalIssued = 1451
  const resolvedRate = 92
  const avgDelivery = 96

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Notices issued (6 mo)" value={totalIssued.toLocaleString()} icon={FileText} hint="+8.4% vs prior period" />
        <StatCard label="Resolution rate" value={`${resolvedRate}%`} icon={CheckCircle2} tone="success" />
        <StatCard label="Avg delivery rate" value={`${avgDelivery}%`} icon={Send} tone="default" />
        <StatCard label="Avg time to resolve" value="3.2 days" icon={TrendingUp} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notice volume</CardTitle>
            <CardDescription>Issued vs resolved outcome notices by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={volumeConfig} className="h-[280px] w-full">
              <BarChart data={volumeData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="issued" fill="var(--color-issued)" radius={4} />
                <Bar dataKey="resolved" fill="var(--color-resolved)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery reliability</CardTitle>
            <CardDescription>SMS + email delivery rate over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={deliveryConfig} className="h-[280px] w-full">
              <LineChart data={deliveryData} accessibilityLayer margin={{ left: 4, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis domain={[80, 100]} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="rate" type="monotone" stroke="var(--color-rate)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notices by service type</CardTitle>
            <CardDescription>Distribution of outcome notices across NIRA services</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={serviceConfig} className="h-[320px] w-full">
              <BarChart data={serviceData} layout="vertical" accessibilityLayer margin={{ left: 8 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="service"
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  tickMargin={4}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" radius={4}>
                  {serviceData.map((entry) => (
                    <Cell key={entry.service} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
