"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal, ArrowUpDown, Download, CloudOff, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ServiceIcon } from "@/components/service-icon"
import { CaseStatusBadge, DeliveryStatusBadge } from "@/components/status-badge"
import {
  SERVICES,
  CASE_STATUSES,
  serviceName,
  formatDateTime,
  maskNin,
  type NoticeRecord,
  type DeliveryStatus,
} from "@/lib/nira"
import { noticesToCsv, downloadTextFile, timestampSlug } from "@/lib/export-csv"

type SortKey = "dateTime" | "clientName" | "service"

const DELIVERY_FILTER: DeliveryStatus[] = ["Pending", "Queued", "Sent", "Delivered", "Failed"]

export function RegisterTable({ notices }: { notices: NoticeRecord[] }) {
  const [query, setQuery] = useState("")
  const [service, setService] = useState<string>("all")
  const [delivery, setDelivery] = useState<string>("all")
  const [caseStatus, setCaseStatus] = useState<string>("all")
  const [sortKey, setSortKey] = useState<SortKey>("dateTime")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = notices.filter((n) => {
      if (service !== "all" && n.service !== service) return false
      if (delivery !== "all" && n.smsStatus !== delivery && n.emailStatus !== delivery) return false
      if (caseStatus !== "all" && n.caseStatus !== caseStatus) return false
      if (!q) return true
      return (
        n.clientName.toLowerCase().includes(q) ||
        n.noticeNumber.toLowerCase().includes(q) ||
        n.phone.toLowerCase().includes(q) ||
        serviceName(n.service).toLowerCase().includes(q)
      )
    })
    rows.sort((a, b) => {
      let cmp = 0
      if (sortKey === "dateTime") cmp = a.dateTime.localeCompare(b.dateTime)
      else if (sortKey === "clientName") cmp = a.clientName.localeCompare(b.clientName)
      else cmp = serviceName(a.service).localeCompare(serviceName(b.service))
      return sortDir === "asc" ? cmp : -cmp
    })
    return rows
  }, [notices, query, service, delivery, caseStatus, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "clientName" || key === "service" ? "asc" : "desc")
    }
  }

  function handleExport() {
    if (filtered.length === 0) {
      toast.error("Nothing to export with the current filters.")
      return
    }
    downloadTextFile(`nira-register-${timestampSlug()}.csv`, noticesToCsv(filtered))
    toast.success(`Exported ${filtered.length} notice${filtered.length === 1 ? "" : "s"} to CSV.`)
  }

  const hasFilters = query !== "" || service !== "all" || delivery !== "all" || caseStatus !== "all"

  function clearFilters() {
    setQuery("")
    setService("all")
    setDelivery("all")
    setCaseStatus("all")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search + filters. On phones the search is full-width and filters wrap. */}
      <div className="flex flex-col gap-3">
        <div className="w-full">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search name, notice number, or phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search notices"
            />
          </InputGroup>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={service} onValueChange={(v) => setService(v ?? "all")}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[170px]" aria-label="Filter by service">
              <SelectValue placeholder="Service" />
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
          <Select value={delivery} onValueChange={(v) => setDelivery(v ?? "all")}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[140px]" aria-label="Filter by delivery status">
              <SelectValue placeholder="Delivery" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All delivery</SelectItem>
              {DELIVERY_FILTER.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={caseStatus} onValueChange={(v) => setCaseStatus(v ?? "all")}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[170px]" aria-label="Filter by case status">
              <SelectValue placeholder="Case status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {CASE_STATUSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} className="w-[calc(50%-0.25rem)] sm:w-auto">
            <Download data-icon="inline-start" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of {notices.length} notices
        </span>
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {/* Mobile / tablet: stacked cards. */}
      <div className="flex flex-col gap-3 lg:hidden">
        {filtered.map((n) => (
          <Link
            key={n.id}
            href={`/register/${n.id}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 active:bg-muted/60"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <ServiceIcon service={n.service} className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-foreground">{n.clientName}</span>
                {n.syncState === "queued" ? (
                  <CloudOff className="size-3.5 shrink-0 text-warning" aria-label="Queued offline" />
                ) : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">{serviceName(n.service)}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <CaseStatusBadge status={n.caseStatus} />
                <span className="text-[11px] text-muted-foreground">{formatDateTime(n.dateTime)}</span>
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        ))}
        {filtered.length === 0 ? (
          <Empty className="rounded-lg border border-border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SlidersHorizontal />
              </EmptyMedia>
              <EmptyTitle>No matching notices</EmptyTitle>
              <EmptyDescription>Adjust your search or filters to see results.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </div>

      {/* Desktop: data table. */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("dateTime")}
                  className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Issued <ArrowUpDown className="size-3.5 opacity-60" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("clientName")}
                  className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                >
                  Client <ArrowUpDown className="size-3.5 opacity-60" />
                </button>
              </TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Notice number</TableHead>
              <TableHead>Case status</TableHead>
              <TableHead>SMS</TableHead>
              <TableHead className="text-right">Officer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  <Link href={`/register/${n.id}`} className="block">
                    {formatDateTime(n.dateTime)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/register/${n.id}`} className="block">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      {n.clientName}
                      {n.syncState === "queued" ? (
                        <CloudOff className="size-3.5 text-warning" aria-label="Queued offline" />
                      ) : null}
                    </span>
                    <span className="block text-xs text-muted-foreground">{maskNin(n.nin)}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/register/${n.id}`} className="flex items-center gap-2">
                    <ServiceIcon service={n.service} className="size-4 text-muted-foreground" />
                    <span className="text-sm">{serviceName(n.service)}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/register/${n.id}`} className="block font-mono text-xs text-muted-foreground">
                    {n.noticeNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <CaseStatusBadge status={n.caseStatus} />
                </TableCell>
                <TableCell>
                  <DeliveryStatusBadge status={n.smsStatus} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-right text-sm text-muted-foreground">
                  {n.officer}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SlidersHorizontal />
              </EmptyMedia>
              <EmptyTitle>No matching notices</EmptyTitle>
              <EmptyDescription>Adjust your search or filters to see results.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </div>
    </div>
  )
}
