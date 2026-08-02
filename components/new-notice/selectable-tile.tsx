"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function SelectableTile({
  selected,
  onSelect,
  icon,
  label,
  hint,
  multi = false,
  disabled = false,
}: {
  selected: boolean
  onSelect: () => void
  icon?: React.ReactNode
  label: string
  hint?: string
  multi?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group relative flex min-h-11 w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      {icon ? (
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md [&_svg]:size-4",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium leading-snug text-balance">{label}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center border transition-colors",
          multi ? "rounded-[5px]" : "rounded-full",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background",
        )}
        aria-hidden="true"
      >
        {selected ? <Check className="size-3.5" /> : null}
      </span>
    </button>
  )
}
