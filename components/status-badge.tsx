import { cn } from "@/lib/utils"
import type { CaseStatus, DeliveryStatus } from "@/lib/nira"

const CASE_STYLES: Record<CaseStatus, string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  Issued: "bg-secondary text-secondary-foreground border-border",
  "Awaiting Client Action": "bg-primary/10 text-primary border-primary/20",
  "Awaiting NIRA Action": "bg-warning/15 text-warning-foreground border-warning/40",
  "Under Review": "bg-primary/10 text-primary border-primary/20",
  Resolved: "bg-success/15 text-success border-success/40",
  Escalated: "bg-destructive/10 text-destructive border-destructive/30",
  Revised: "bg-accent text-accent-foreground border-border",
  Cancelled: "bg-muted text-muted-foreground border-border line-through",
}

const DELIVERY_STYLES: Record<DeliveryStatus, string> = {
  Pending: "bg-muted text-muted-foreground border-border",
  Queued: "bg-secondary text-secondary-foreground border-border",
  Sent: "bg-primary/10 text-primary border-primary/20",
  Delivered: "bg-success/15 text-success border-success/40",
  Failed: "bg-destructive/10 text-destructive border-destructive/30",
}

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning-foreground border-warning/40",
  Low: "bg-muted text-muted-foreground border-border",
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  )
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <Pill className={CASE_STYLES[status]}>{status}</Pill>
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus | string }) {
  const style = DELIVERY_STYLES[status as DeliveryStatus] ?? DELIVERY_STYLES.Pending
  const dotColor =
    status === "Delivered"
      ? "bg-success"
      : status === "Failed"
        ? "bg-destructive"
        : status === "Sent" || status === "Queued"
          ? "bg-primary"
          : "bg-muted-foreground"
  return (
    <Pill className={style}>
      <span className={cn("size-1.5 rounded-full", dotColor)} aria-hidden="true" />
      {status}
    </Pill>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Pill className={PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low}>{priority}</Pill>
}
