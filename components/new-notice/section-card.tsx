import { cn } from "@/lib/utils"

export function SectionCard({
  step,
  title,
  description,
  complete,
  disabled,
  action,
  children,
  className,
}: {
  step: string
  title: string
  description?: string
  complete?: boolean
  disabled?: boolean
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      aria-disabled={disabled}
      className={cn(
        "rounded-xl border border-border bg-card",
        disabled && "pointer-events-none opacity-55",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            complete ? "bg-success text-success-foreground" : "bg-primary/10 text-primary",
          )}
          aria-hidden="true"
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}
