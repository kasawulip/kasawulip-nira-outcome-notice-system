import {
  SERVICES,
  serviceName,
  type NoticeRecord,
  type CaseStatus,
} from "@/lib/nira"

export interface ReportStats {
  total: number
  resolved: number
  open: number
  resolutionRate: number // 0-100
  delivered: number
  deliveryRate: number // 0-100 (SMS delivered/sent)
  queued: number
  byService: { id: string; label: string; count: number }[]
  byStatus: { status: CaseStatus; count: number }[]
  byDistrict: { district: string; count: number }[]
}

const OPEN_STATUSES: CaseStatus[] = [
  "Awaiting Client Action",
  "Awaiting NIRA Action",
  "Under Review",
  "Escalated",
]

export function computeReportStats(notices: NoticeRecord[]): ReportStats {
  const total = notices.length
  const resolved = notices.filter((n) => n.caseStatus === "Resolved").length
  const open = notices.filter((n) => OPEN_STATUSES.includes(n.caseStatus)).length
  const delivered = notices.filter((n) => n.smsStatus === "Delivered").length
  const sent = notices.filter((n) => n.smsStatus === "Delivered" || n.smsStatus === "Sent").length
  const queued = notices.filter((n) => n.syncState === "queued").length

  const byService = SERVICES.map((s) => ({
    id: s.id,
    label: serviceName(s.id),
    count: notices.filter((n) => n.service === s.id).length,
  }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)

  const statusOrder: CaseStatus[] = [
    "Resolved",
    "Awaiting Client Action",
    "Awaiting NIRA Action",
    "Under Review",
    "Escalated",
    "Issued",
    "Revised",
    "Cancelled",
    "Draft",
  ]
  const byStatus = statusOrder
    .map((status) => ({
      status,
      count: notices.filter((n) => n.caseStatus === status).length,
    }))
    .filter((s) => s.count > 0)

  const districtMap = new Map<string, number>()
  for (const n of notices) districtMap.set(n.office, (districtMap.get(n.office) ?? 0) + 1)
  const byDistrict = [...districtMap.entries()]
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)

  return {
    total,
    resolved,
    open,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    delivered,
    deliveryRate: sent ? Math.round((delivered / sent) * 100) : 0,
    queued,
    byService,
    byStatus,
    byDistrict,
  }
}
