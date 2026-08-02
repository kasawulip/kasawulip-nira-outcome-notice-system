"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal, ArrowUpDown, Download } from "lucide-react"

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

  const hasFilters = query !== "" || service !== "all" || delivery !== "all" || caseStatus !== "all"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-md">
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
          <Select value={service} onValueChange={setService}>
            <SelectTrigger className="w-[180px]" aria-label="Filter by service">
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
          <Select value={delivery} onValueChange={setDelivery}>
            <SelectTrigger className="w-[150px]" aria-label="Filter by delivery status">
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
          <Select value={caseStatus} onValueChange={setCaseStatus}>
            <SelectTrigger className="w-[180px]" aria-label="Filter by case status">
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
          <Button variant="outline">
            <Download data-icon="inline-start" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of {notices.length} notices
        </span>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("")
              setService("all")
              setDelivery("all")
              setCaseStatus("all")
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
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
                    <span className="font-medium text-foreground">{n.clientName}</span>
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
