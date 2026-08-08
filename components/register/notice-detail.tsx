"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Printer,
  Download,
  Send,
  RefreshCw,
  CheckCircle2,
  Copy,
  MessageSquare,
  Mail,
  FileText,
  Clock,
  ShieldCheck,
  QrCode as QrCodeIcon,
  Copy as CopyIcon,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { NoticePreview } from "@/components/notice-preview"
import { QRCode } from "@/components/qr-code"
import { CaseStatusBadge, DeliveryStatusBadge, PriorityBadge } from "@/components/status-badge"
import { ServiceIcon } from "@/components/service-icon"
import {
  serviceName,
  formatDateTime,
  formatDate,
  maskNin,
  isNoticeValid,
  noticeVerifyUrl,
  type NoticeRecord,
  type ReferralEmailStatus,
  type TrackingStatus,
} from "@/lib/nira"
import { cn } from "@/lib/utils"
import {
  noticeToPreview,
  auditTrailFor,
  deliveryHistoryFor,
} from "@/lib/mock-notices"
import { useDataStore } from "@/components/data-store-context"

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="w-full shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-48">
        {label}
      </span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  )
}

function ReferralEmailStatusBadge({ status }: { status?: ReferralEmailStatus }) {
  const map: Record<ReferralEmailStatus, { label: string; className: string }> = {
    "not-required": { label: "Not required", className: "bg-muted text-muted-foreground" },
    pending: { label: "Delivery pending", className: "bg-warning/15 text-warning-foreground border border-warning/40" },
    sent: { label: "Delivered", className: "bg-success/15 text-success border border-success/40" },
    failed: { label: "Delivery failed", className: "bg-destructive/10 text-destructive border border-destructive/30" },
  }
  const s = map[status ?? "not-required"]
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", s.className)}>
      {s.label}
    </span>
  )
}

function TrackingStatusBadge({ status }: { status?: TrackingStatus }) {
  const s = status ?? "ISSUED"
  const valid = isNoticeValid(s)
  const tone = !valid
    ? "bg-destructive/10 text-destructive border border-destructive/30"
    : s === "ISSUED"
      ? "bg-secondary text-secondary-foreground"
      : s === "VIEWED"
        ? "bg-warning/15 text-warning-foreground border border-warning/40"
        : "bg-primary/10 text-primary border border-primary/30"
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", tone)}>
      {s}
    </span>
  )
}

const CHANNEL_ICON = {
  SMS: MessageSquare,
  Email: Mail,
  PDF: FileText,
} as const

export function NoticeDetail({ notice }: { notice: NoticeRecord }) {
  const { updateCaseStatus, sendReferralEmail } = useDataStore()
  const caseStatus = notice.caseStatus
  const preview = noticeToPreview(notice)
  const audit = auditTrailFor(notice)
  const delivery = deliveryHistoryFor(notice)
  // In-flight guard so repeated clicks cannot fire multiple concurrent resends.
  const [resending, setResending] = useState(false)

  function copyNumber() {
    navigator.clipboard?.writeText(notice.noticeNumber)
    toast.success("Notice number copied", { description: notice.noticeNumber })
  }

  function resendReferral() {
    if (!notice.referralEmail || resending) return
    setResending(true)
    toast.info("Resending referral email…", { description: notice.referralEmail })
    void sendReferralEmail(notice.id)
      .then((sent) => {
        if (sent) {
          toast.success("Referral email delivered", { description: notice.referralEmail })
        } else {
          toast.error("Referral email failed again", { description: "Please try once more shortly." })
        }
      })
      .finally(() => setResending(false))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex flex-col gap-4">
        <Link
          href="/register"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to register
        </Link>
        <div className="flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <ServiceIcon service={notice.service} className="size-5 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{notice.clientName}</h1>
              <CaseStatusBadge status={caseStatus} />
              <PriorityBadge priority={notice.priority} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{serviceName(notice.service)}</span>
              <Separator orientation="vertical" className="h-4" />
              <button
                type="button"
                onClick={copyNumber}
                className="inline-flex items-center gap-1 font-mono text-xs hover:text-foreground"
              >
                {notice.noticeNumber}
                <Copy className="size-3" />
              </button>
              <Separator orientation="vertical" className="h-4" />
              <span>{formatDateTime(notice.dateTime)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer data-icon="inline-start" />
              Print
            </Button>
            <Button variant="outline" onClick={() => toast.success("PDF downloaded", { description: "notice.pdf" })}>
              <Download data-icon="inline-start" />
              PDF
            </Button>
            <Button
              onClick={() =>
                toast.success("Notice resent", { description: `SMS re-sent to ${notice.phone}` })
              }
            >
              <Send data-icon="inline-start" />
              Resend
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notice">Notice (PDF)</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
              <TabsTrigger value="audit">Audit trail</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Outcome details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col divide-y divide-border pt-0">
                  <InfoRow label="Client name">{notice.clientName}</InfoRow>
                  <InfoRow label="Telephone">{notice.phone}</InfoRow>
                  <InfoRow label="Email">{notice.email ?? "—"}</InfoRow>
                  <InfoRow label="NIN / Application">{maskNin(notice.nin)}</InfoRow>
                  <InfoRow label="Service requested">{serviceName(notice.service)}</InfoRow>
                  <InfoRow label="Reason(s)">
                    <ul className="list-inside list-disc">
                      {notice.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </InfoRow>
                  <InfoRow label="Action required">{notice.action}</InfoRow>
                  <InfoRow label="Where to go next">{notice.destination}</InfoRow>
                  {notice.cardLocationType ? (
                    <>
                      <InfoRow label="Card collection location">{notice.cardLocationText ?? "—"}</InfoRow>
                      {notice.cardBatchNumber ? (
                        <InfoRow label="Card batch number">{notice.cardBatchNumber}</InfoRow>
                      ) : null}
                      {notice.cardLocationType === "LOCAL_OUTREACH" && notice.outreachContactStaffName ? (
                        <InfoRow label="Officer / staff to contact">
                          {[notice.outreachContactStaffName, notice.outreachContactStaffPhone]
                            .filter(Boolean)
                            .join(" · ")}
                        </InfoRow>
                      ) : null}
                    </>
                  ) : null}
                  {notice.referralEmail ? (
                    <InfoRow label="Referral email">
                      <span className="flex flex-wrap items-center gap-2">
                        <span>{notice.referralEmail}</span>
                        <ReferralEmailStatusBadge status={notice.referralEmailStatus} />
                        {notice.referralEmailStatus === "failed" || notice.referralEmailStatus === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1.5"
                            onClick={resendReferral}
                            disabled={resending}
                          >
                            <RefreshCw className={cn("size-3.5", resending && "animate-spin")} />
                            {resending ? "Resending…" : "Resend"}
                          </Button>
                        ) : null}
                      </span>
                    </InfoRow>
                  ) : null}
                  <InfoRow label="Expected timeline">{notice.timeline}</InfoRow>
                  {notice.additional ? <InfoRow label="Additional details">{notice.additional}</InfoRow> : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notice">
              <div className="rounded-lg border border-border bg-muted/40 p-3 sm:p-6">
                <NoticePreview data={preview} />
              </div>
            </TabsContent>

            <TabsContent value="delivery">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery history</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-0">
                  {delivery.map((event, i) => {
                    const Icon = CHANNEL_ICON[event.channel]
                    return (
                      <div key={`${event.channel}-${i}`} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                          <Icon className="size-4" />
                        </span>
                        <div className="flex flex-1 flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-foreground">{event.channel}</span>
                            <DeliveryStatusBadge status={event.status} />
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDateTime(event.time)}</span>
                          {event.detail ? (
                            <span className="text-xs text-destructive">{event.detail}</span>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                  {delivery.some((e) => e.status === "Failed") ? (
                    <Button
                      variant="outline"
                      className="w-fit"
                      onClick={() => toast.success("Retry queued", { description: "Delivery will be re-attempted." })}
                    >
                      <RefreshCw data-icon="inline-start" />
                      Retry failed delivery
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle>Audit trail</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ol className="relative flex flex-col gap-5 border-l border-border pl-6">
                    {audit.map((entry, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[27px] top-0.5 flex size-3 items-center justify-center rounded-full border-2 border-background bg-primary" />
                        <p className="text-sm font-medium text-foreground">{entry.event}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(entry.time)} · {entry.actor}
                        </p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: summary + case management */}
        <div className="flex flex-col gap-6">
          {notice.retrievalToken ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCodeIcon className="size-4 text-muted-foreground" />
                  Referral QR &amp; tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-0">
                <div className="flex items-center gap-4">
                  <QRCode value={noticeVerifyUrl(notice.retrievalToken)} size={104} className="shrink-0" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tracking status
                    </span>
                    <TrackingStatusBadge status={notice.trackingStatus} />
                    <span className="text-xs text-muted-foreground">
                      {isNoticeValid(notice.trackingStatus)
                        ? "Valid until closed or cancelled — never expires on a timer."
                        : "This referral is no longer active."}
                    </span>
                  </div>
                </div>
                {notice.viewedAt ? (
                  <p className="text-xs text-muted-foreground">First scanned {formatDateTime(notice.viewedAt)}</p>
                ) : null}
                {notice.acknowledgedAt ? (
                  <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-2.5 text-xs">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">
                      Received by {notice.acknowledgedByOfficer} · {notice.acknowledgedByOffice} ·{" "}
                      {formatDateTime(notice.acknowledgedAt)}
                    </span>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard?.writeText(noticeVerifyUrl(notice.retrievalToken!))
                      toast.success("Verification link copied")
                    }}
                  >
                    <CopyIcon data-icon="inline-start" />
                    Copy link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(noticeVerifyUrl(notice.retrievalToken!), "_blank", "noreferrer")}
                  >
                    <ExternalLink data-icon="inline-start" />
                    Open verify page
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-muted-foreground" />
                Case management
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-0">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current status
                </span>
                <CaseStatusBadge status={caseStatus} />
              </div>
              {notice.expectedCompletion ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Expected completion
                  </span>
                  <span className="text-sm text-foreground">{formatDate(notice.expectedCompletion)}</span>
                </div>
              ) : null}
              <Separator />
              <div className="flex flex-col gap-2">
                {caseStatus !== "Resolved" ? (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      updateCaseStatus(notice.id, "Resolved")
                      toast.success("Case resolved", { description: notice.clientName })
                    }}
                  >
                    <CheckCircle2 data-icon="inline-start" />
                    Mark as resolved
                  </Button>
                ) : null}
                {caseStatus !== "Escalated" && caseStatus !== "Resolved" ? (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      updateCaseStatus(notice.id, "Escalated")
                      toast.warning("Case escalated", { description: "Forwarded for supervisor review." })
                    }}
                  >
                    <ShieldCheck data-icon="inline-start" />
                    Escalate for review
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Serving officer</span>
                <span className="font-medium text-foreground">{notice.officer}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Office</span>
                <span className="font-medium text-foreground">{notice.office}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">PDF</span>
                <DeliveryStatusBadge status={notice.pdfStatus} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
