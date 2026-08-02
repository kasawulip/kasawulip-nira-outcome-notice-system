"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Printer, FileText, Copy, FilePlus2, MessageSquare, Mail, FileCheck } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { DeliveryStatusBadge } from "@/components/status-badge"
import type { DeliveryStatus, DeliveryMethod } from "@/lib/nira"
import type { PreviewData } from "@/components/notice-preview"
import { cn } from "@/lib/utils"

export interface IssuedNotice {
  data: PreviewData
  deliveryMethod: DeliveryMethod
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

  const sendsSms = issued?.deliveryMethod !== "print"
  const sendsEmail = issued?.deliveryMethod === "sms-email" && !!issued?.data.email

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
  const { data } = issued

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onNewNotice()
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-lg gap-0 overflow-hidden p-0">
        <div className="flex flex-col items-center gap-2 border-b border-border bg-success/10 px-6 py-5 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success text-success-foreground">
            <CheckCircle2 className="size-7" />
          </span>
          <DialogTitle className="text-lg font-semibold">Notice issued successfully.</DialogTitle>
          <p className="font-mono text-sm font-semibold text-primary">{data.noticeNumber}</p>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex flex-col">
              <dt className="text-xs text-muted-foreground">Client</dt>
              <dd className="font-medium">{data.clientName}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs text-muted-foreground">Service</dt>
              <dd className="font-medium">{data.serviceName}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs text-muted-foreground">Phone</dt>
              <dd className="font-medium">{data.phone}</dd>
            </div>
            {data.email ? (
              <div className="flex min-w-0 flex-col">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="truncate font-medium">{data.email}</dd>
              </div>
            ) : null}
          </dl>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Delivery status
            </span>
            {sendsSms ? (
              <DeliveryLine
                icon={<MessageSquare />}
                label="SMS notification"
                target={data.phone}
                status="Delivered"
                pending={smsPending}
              />
            ) : null}
            {sendsEmail ? (
              <DeliveryLine
                icon={<Mail />}
                label="Email with PDF"
                target={data.email}
                status="Delivered"
                pending={emailPending}
              />
            ) : null}
            <DeliveryLine icon={<FileCheck />} label="PDF notice" status="Delivered" pending={false} />
          </div>

          <p className="text-xs text-muted-foreground">
            You can start the next notice immediately — delivery continues in the background.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-border bg-muted/40 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.print()}
          >
            <Printer data-icon="inline-start" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onPreview}>
            <FileText data-icon="inline-start" />
            View PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              navigator.clipboard?.writeText(data.noticeNumber)
              toast.success("Ticket number copied")
            }}
          >
            <Copy data-icon="inline-start" />
            Copy Ticket
          </Button>
          <Button size="sm" className={cn("w-full sm:w-auto sm:flex-[2]")} onClick={onNewNotice}>
            <FilePlus2 data-icon="inline-start" />
            New Notice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
