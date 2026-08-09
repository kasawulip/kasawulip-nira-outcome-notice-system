"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle2,
  CloudOff,
  FileText,
  FilePlus2,
  MessageSquare,
  Mail,
  FileCheck,
  Share2,
  Download,
} from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { DeliveryStatusBadge } from "@/components/status-badge"
import { QRCode } from "@/components/qr-code"
import { buildShareCard } from "@/lib/qr"
import type { DeliveryStatus, DeliveryMethod } from "@/lib/nira"
import type { PreviewData } from "@/components/notice-preview"

export interface IssuedNotice {
  data: PreviewData
  deliveryMethod: DeliveryMethod
  queued?: boolean
  /** Absolute verification URL encoded in the QR for this notice. */
  verifyUrl: string
}

function DeliveryLine({
  icon,
  label,
  target,
  status,
  pending,
}: {
  icon: React.ReactNode
  label: string
  target?: string
  status: DeliveryStatus
  pending: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{label}</span>
        {target ? <span className="truncate text-xs text-muted-foreground">{target}</span> : null}
      </div>
      {pending ? (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Spinner className="size-3.5" /> Sending…
        </span>
      ) : (
        <DeliveryStatusBadge status={status} />
      )}
    </div>
  )
}

export function SuccessDialog({
  issued,
  onNewNotice,
  onPreview,
}: {
  issued: IssuedNotice | null
  onNewNotice: () => void
  onPreview: () => void
}) {
  const open = issued !== null
  const [smsPending, setSmsPending] = useState(true)
  const [emailPending, setEmailPending] = useState(true)
  const [sharing, setSharing] = useState(false)

  const sendsSms = issued?.deliveryMethod === "sms"
  const sendsEmail = issued?.deliveryMethod === "email" && !!issued?.data.email

  useEffect(() => {
    if (!open) return
    setSmsPending(true)
    setEmailPending(true)
    const t1 = setTimeout(() => setSmsPending(false), 1400)
    const t2 = setTimeout(() => setEmailPending(false), 2400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [open, issued?.data.noticeNumber])

  if (!issued) return null
  const { data, queued, verifyUrl } = issued

  async function handleShareQr() {
    setSharing(true)
    try {
      const dataUrl = await buildShareCard({
        verifyUrl,
        noticeNumber: data.noticeNumber,
        clientName: data.clientName,
        destination: data.destination,
      })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], `${data.noticeNumber}-QR.png`, { type: "image/png" })

      // Prefer the native share sheet on capable (mobile) devices so the officer
      // can send the image straight to the client; fall back to a download.
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean }
      if (typeof navigator.share === "function" && nav.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Central Region Notice ${data.noticeNumber}`,
          text: "Present this QR code at the NIRA office you have been referred to.",
        })
      } else {
        const a = document.createElement("a")
        a.href = dataUrl
        a.download = `${data.noticeNumber}-QR.png`
        a.click()
        toast.success("QR image saved", { description: "Share it with the client." })
      }
    } catch {
      toast.error("Could not generate the QR image. Please try again.")
    } finally {
      setSharing(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onNewNotice()
      }}
    >
      <DialogContent showCloseButton={false} className="max-h-[92vh] max-w-lg gap-0 overflow-y-auto p-0">
        {queued ? (
          <div className="flex flex-col items-center gap-2 border-b border-border bg-warning/15 px-6 py-5 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-warning text-warning-foreground">
              <CloudOff className="size-7" />
            </span>
            <DialogTitle className="text-lg font-semibold">Saved &amp; queued offline.</DialogTitle>
            <p className="font-mono text-sm font-semibold text-primary">{data.noticeNumber}</p>
            <p className="text-xs text-muted-foreground">
              This notice will be sent automatically once your connection is restored. The QR below already
              works for retrieval.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 border-b border-border bg-success/10 px-6 py-4 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-success text-success-foreground">
              <CheckCircle2 className="size-6" />
            </span>
            <DialogTitle className="text-base font-semibold uppercase tracking-wide">
              Client Services Outcome Notice Issued
            </DialogTitle>
            <p className="font-mono text-sm font-semibold text-primary">Notice No: {data.noticeNumber}</p>
          </div>
        )}

        {/* Prominent QR for the client */}
        <div className="flex flex-col items-center gap-3 border-b border-border px-6 py-5">
          <QRCode value={verifyUrl} size={208} errorCorrectionLevel="M" />
          <p className="max-w-xs text-balance text-center text-sm text-muted-foreground">
            Scan this QR code at any NIRA office to retrieve this notice.
          </p>
          <div className="flex w-full flex-col items-center gap-0.5 rounded-md bg-muted/50 px-3 py-2 text-center text-xs">
            <span className="font-mono font-semibold text-primary">{data.noticeNumber}</span>
            <span className="text-muted-foreground">{data.destination}</span>
          </div>
          <div className="grid w-full grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={onPreview}>
              <FileText data-icon="inline-start" />
              View Notice
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download data-icon="inline-start" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareQr} disabled={sharing}>
              {sharing ? <Spinner className="size-4" data-icon="inline-start" /> : <Share2 data-icon="inline-start" />}
              Share QR
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Delivery status
            </span>
            {sendsSms ? (
              <DeliveryLine
                icon={<MessageSquare />}
                label="SMS notification"
                target={data.phone}
                status={queued ? "Queued" : "Delivered"}
                pending={queued ? false : smsPending}
              />
            ) : null}
            {sendsEmail ? (
              <DeliveryLine
                icon={<Mail />}
                label="Email with PDF"
                target={data.email}
                status={queued ? "Queued" : "Delivered"}
                pending={queued ? false : emailPending}
              />
            ) : null}
            <DeliveryLine
              icon={<FileCheck />}
              label="PDF notice"
              status={queued ? "Queued" : "Delivered"}
              pending={false}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            SMS and email are optional — the client only needs to keep the QR image (or a photo of it) and
            present it at the receiving office.
          </p>
        </div>

        <div className="border-t border-border bg-muted/40 p-4">
          <Button className="w-full" onClick={onNewNotice}>
            <FilePlus2 data-icon="inline-start" />
            New Notice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
