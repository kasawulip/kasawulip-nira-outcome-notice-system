"use client"

import { useEffect, useState } from "react"
import {
  ShieldCheck,
  ShieldX,
  FileText,
  Download,
  CheckCircle2,
  Loader2,
  Building2,
  BadgeCheck,
} from "lucide-react"
import { toast } from "sonner"

import { NiraLogo } from "@/components/nira-logo"
import { NoticePreview } from "@/components/notice-preview"
import { Button } from "@/components/ui/button"
import { useDataStore } from "@/components/data-store-context"
import { useSession } from "@/components/session-context"
import { noticeToPreview } from "@/lib/mock-notices"
import {
  serviceName,
  formatDate,
  formatDateTime,
  isNoticeValid,
  type TrackingStatus,
} from "@/lib/nira"
import { cn } from "@/lib/utils"

function StatusPill({ status }: { status?: TrackingStatus }) {
  const valid = isNoticeValid(status)
  const acknowledged = status === "RECEIVED AT DESTINATION" || status === "ACTIONED"
  const label = status === "CANCELLED" ? "Cancelled" : status === "CLOSED" ? "Closed" : "Valid"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
        valid
          ? acknowledged
            ? "bg-primary/10 text-primary"
            : "bg-success/15 text-success"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {valid ? <ShieldCheck className="size-4" /> : <ShieldX className="size-4" />}
      {label}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-dashed border-border py-2.5 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  )
}

export function PublicVerify({ token }: { token: string }) {
  const { ready, findByToken, recordView, acknowledgeReferral } = useDataStore()
  const { account } = useSession()
  const notice = findByToken(token)
  const [showFull, setShowFull] = useState(false)
  // In-flight guard so a double-tap cannot acknowledge (and toast) twice.
  const [acknowledging, setAcknowledging] = useState(false)

  // Record a view the first time an ISSUED notice is opened via its QR.
  useEffect(() => {
    if (ready && notice) recordView(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, notice?.id])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/40">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!notice) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-muted/40 p-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldX className="size-7" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-foreground">Notice not found</h1>
          <p className="max-w-sm text-pretty text-sm text-muted-foreground">
            This verification link is invalid or the notice has been removed. Check the code and try again,
            or search the Notice Number manually at a NIRA office.
          </p>
        </div>
      </div>
    )
  }

  const preview = noticeToPreview(notice)

  async function handleAcknowledge() {
    if (!account || acknowledging) return
    setAcknowledging(true)
    acknowledgeReferral(token, {
      office: account.district ?? account.name,
      officer: account.name,
    })
    toast.success("Referral acknowledged", {
      description: `${notice?.noticeNumber} recorded as received.`,
    })
    // On success the acknowledge section unmounts; the guard blocks any repeat
    // trigger that lands before that re-render.
  }

  return (
    <div className="min-h-dvh bg-muted/40 pb-12">
      {/* Branded header */}
      <header className="bg-primary px-4 py-5 text-primary-foreground">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <NiraLogo variant="dark" className="size-11" />
          <div className="flex flex-col">
            <span className="font-serif text-base font-bold leading-tight">
              Central Region
            </span>
            <span className="text-xs text-primary-foreground/70">Client Services Outcome Notice · Verification</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        {/* Verification summary (public — minimal information only) */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notice Number
              </span>
              <span className="font-mono text-lg font-bold text-primary">{notice.noticeNumber}</span>
            </div>
            <StatusPill status={notice.trackingStatus} />
          </div>

          <dl className="flex flex-col pt-1">
            <Field label="Issued From">{notice.office}</Field>
            <Field label="Date Issued">{formatDate(notice.dateTime)}</Field>
            <Field label="Service Requested">{serviceName(notice.service)}</Field>
            <Field label="Referral Destination">{notice.destination}</Field>
            {notice.cardBatchNumber ? <Field label="Batch Number">{notice.cardBatchNumber}</Field> : null}
          </dl>

          {notice.acknowledgedAt ? (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-sm">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="flex flex-col">
                <span className="font-medium text-foreground">Received at destination</span>
                <span className="text-xs text-muted-foreground">
                  Acknowledged by {notice.acknowledgedByOfficer} · {notice.acknowledgedByOffice} ·{" "}
                  {formatDateTime(notice.acknowledgedAt)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setShowFull((v) => !v)}>
              <FileText data-icon="inline-start" />
              {showFull ? "Hide Notice" : "View Full Notice"}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Download data-icon="inline-start" />
              Download PDF
            </Button>
          </div>
        </section>

        {/* Acknowledge — only for an authenticated receiving officer */}
        {account ? (
          notice.acknowledgedAt ? null : (
            <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">Receiving officer action</span>
                    <span className="text-xs text-muted-foreground">
                      Signed in as {account.name}
                      {account.district ? ` · ${account.district}` : ""}. Confirm this client has reported to
                      your office.
                    </span>
                  </div>
                  <Button className="w-full sm:w-auto" onClick={handleAcknowledge} disabled={acknowledging}>
                    {acknowledging ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <CheckCircle2 data-icon="inline-start" />
                    )}
                    Acknowledge Client Referral
                  </Button>
                </div>
              </div>
            </section>
          )
        ) : (
          <p className="px-1 text-center text-xs text-muted-foreground">
            A receiving officer can sign in to acknowledge this referral and view full client details.
          </p>
        )}

        {/* Full immutable notice (controlled retrieval via secure token) */}
        {showFull ? (
          <section className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
            <NoticePreview data={preview} />
          </section>
        ) : null}

        <p className="px-1 text-center text-[11px] leading-relaxed text-muted-foreground">
          This page confirms a genuine Central Region referral. Sensitive client details are masked and never encoded in
          the QR code. Retain the QR image or a printout to present at the receiving office.
        </p>
      </main>
    </div>
  )
}
