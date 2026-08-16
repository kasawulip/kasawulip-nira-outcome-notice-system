import { serviceName, formatDateTime, type NoticeRecord } from "@/lib/nira"

/** Escape a single CSV cell (RFC 4180). */
function cell(value: unknown): string {
  const s = value == null ? "" : String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function noticesToCsv(notices: NoticeRecord[]): string {
  const headers = [
    "Notice Number",
    "Issued",
    "Client Name",
    "NIN",
    "Phone",
    "Service",
    "Reasons",
    "Required Action",
    "Office",
    "Officer",
    "Case Status",
    "SMS Status",
    "Email Status",
    "Priority",
  ]
  const rows = notices.map((n) => [
    n.noticeNumber,
    formatDateTime(n.dateTime),
    n.clientName,
    n.nin ?? "",
    n.phone,
    serviceName(n.service),
    (n.reasons ?? []).join("; "),
    n.action ?? "",
    n.office,
    n.officer,
    n.caseStatus,
    n.smsStatus,
    n.emailStatus ?? "",
    n.priority,
  ])
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n")
}

/** Trigger a client-side download of a text file. No dependencies. */
export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function timestampSlug(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
}
