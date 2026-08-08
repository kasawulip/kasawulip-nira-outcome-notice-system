import { QrCode } from "lucide-react"
import { NiraLogo } from "@/components/nira-logo"
import { maskPhone, maskNin, COMPLAINTS_CONTACTS } from "@/lib/nira"

export interface PreviewData {
  noticeNumber: string
  office: string
  officer: string
  officerTitle: string
  dateLabel: string
  timeLabel: string
  clientName: string
  phone: string
  nin?: string
  email?: string
  serviceName: string
  reasons: string[]
  action: string
  destination: string
  /** Email address of the receiving HQ department, when the referral is to HQ. */
  referralEmail?: string
  timeline: string
  additional?: string
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-dashed border-border py-1.5 sm:flex-row sm:gap-3">
      <span className="w-full shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:w-44">
        {label}
      </span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  )
}

// A one-page A4 reproduction of the official NIRA Client Services Outcome Notice.
export function NoticePreview({ data }: { data: PreviewData }) {
  return (
    <div className="mx-auto w-full max-w-[820px] bg-card p-6 text-foreground shadow-sm sm:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-primary pb-4">
        <div className="flex items-center gap-3">
          <NiraLogo variant="dark" className="size-12 text-base" />
          <div className="flex flex-col">
            <span className="font-serif text-base font-bold leading-tight text-primary sm:text-lg">
              National Identification and Registration Authority
            </span>
            <span className="text-xs text-muted-foreground">Republic of Uganda</span>
          </div>
        </div>
        <div className="hidden flex-col items-center sm:flex">
          <div className="flex size-16 items-center justify-center rounded-md border border-border bg-muted">
            <QrCode className="size-10 text-muted-foreground" aria-hidden="true" />
          </div>
          <span className="mt-1 text-[10px] text-muted-foreground">Scan to verify</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <h2 className="font-serif text-xl font-bold uppercase tracking-wide text-foreground">
          Client Services Outcome Notice
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Issued when a requested service could not be completed during your visit.
        </p>
      </div>

      {/* Meta */}
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 rounded-md bg-muted/60 p-3 sm:grid-cols-3">
        <div className="text-sm">
          <span className="block text-xs font-semibold uppercase text-muted-foreground">Notice Number</span>
          <span className="font-mono text-sm font-semibold text-primary">{data.noticeNumber}</span>
        </div>
        <div className="text-sm">
          <span className="block text-xs font-semibold uppercase text-muted-foreground">District Office</span>
          {data.office}
        </div>
        <div className="text-sm">
          <span className="block text-xs font-semibold uppercase text-muted-foreground">Date &amp; Time</span>
          {data.dateLabel} · {data.timeLabel}
        </div>
      </div>

      {/* Body */}
      <div className="mt-4 flex flex-col">
        <Row label="Client Name">{data.clientName || "—"}</Row>
        <Row label="Telephone">{data.phone ? maskPhone(data.phone) : "—"}</Row>
        <Row label="NIN / Application No.">{maskNin(data.nin)}</Row>
        {data.email ? <Row label="Email">{data.email}</Row> : null}
        <Row label="Service Requested">{data.serviceName || "—"}</Row>
        <Row label="Reason(s) Service Not Completed">
          {data.reasons.length ? (
            <ul className="list-disc pl-4">
              {data.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Action Required">{data.action || "—"}</Row>
        <Row label="Where to Go Next">
          <span className="font-medium">{data.destination || "—"}</span>
          {data.referralEmail ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">Referral email: {data.referralEmail}</span>
          ) : null}
        </Row>
        <Row label="Expected Timeline">{data.timeline || "—"}</Row>
        {data.additional ? <Row label="Additional Details">{data.additional}</Row> : null}
      </div>

      {/* Officer + acknowledgement */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-border p-3">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Serving Officer</span>
          <p className="mt-1 text-sm font-medium">{data.officer}</p>
          <p className="text-xs text-muted-foreground">{data.officerTitle}</p>
          <div className="mt-6 border-t border-dashed border-border pt-1 text-xs text-muted-foreground">
            Officer signature &amp; stamp
          </div>
        </div>
        <div className="rounded-md border border-border p-3">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Client Acknowledgement</span>
          <p className="mt-1 text-xs text-muted-foreground">
            I acknowledge receipt of this notice and understand the required next steps.
          </p>
          <div className="mt-6 flex items-end justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex-1 border-t border-dashed border-border pt-1">Signature</span>
            <span className="w-24 border-t border-dashed border-border pt-1">Date</span>
          </div>
        </div>
      </div>

      {/* Disclaimer + contacts */}
      <div className="mt-4 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
        <strong>Important:</strong> This notice is not a rejection of your application. It confirms that your
        requested service could not be completed during this visit and explains the next steps.
      </div>

      <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Complaints &amp; enquiries: Toll-free {COMPLAINTS_CONTACTS.toll} · {COMPLAINTS_CONTACTS.email}
        </span>
        <span>{COMPLAINTS_CONTACTS.web}</span>
      </div>
    </div>
  )
}
