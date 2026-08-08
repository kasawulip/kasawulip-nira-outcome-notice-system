"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Pencil, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

export interface DisclosureOption {
  value: string
  label: string
  icon?: React.ReactNode
  hint?: string
}

/**
 * Mobile-first progressive-disclosure single-select.
 * - Unselected: shows every option so the officer can review and pick.
 * - Selected: collapses to a compact, highlighted confirmation card with a
 *   checkmark and a subtle "Change" control that re-expands the full list.
 */
export function DisclosureSelect({
  options,
  value,
  onChange,
  ariaLabel,
  layout = "list",
  searchable = false,
  searchPlaceholder = "Search",
  onCommit,
}: {
  options: DisclosureOption[]
  value: string | null
  onChange: (value: string) => void
  ariaLabel: string
  layout?: "list" | "grid"
  searchable?: boolean
  searchPlaceholder?: string
  /** Called after a selection is confirmed — used to advance the guided flow. */
  onCommit?: (value: string) => void
}) {
  const [expanded, setExpanded] = useState(value === null)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  // Collapse automatically once a value exists (e.g. after "Use previous").
  useEffect(() => {
    if (value !== null) setExpanded(false)
  }, [value])

  const selected = options.find((o) => o.value === value) ?? null

  function handleSelect(next: string) {
    onChange(next)
    setExpanded(false)
    setQuery("")
    onCommit?.(next)
  }

  // Collapsed confirmation card
  if (selected && !expanded) {
    return (
      <div
        ref={containerRef}
        className="flex items-center gap-3 rounded-lg border border-primary bg-accent px-3 py-3 ring-1 ring-primary/30"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Check className="size-4" />
        </span>
        {selected.icon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card text-primary [&_svg]:size-4">
            {selected.icon}
          </span>
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-accent-foreground">{selected.label}</span>
          {selected.hint ? <span className="truncate text-xs text-muted-foreground">{selected.hint}</span> : null}
        </span>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex min-h-9 shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <Pencil className="size-3.5" />
          Change
        </button>
      </div>
    )
  }

  const filtered = searchable && query.trim() ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())) : options

  // Expanded option list
  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {searchable ? (
        <InputGroup className="h-10">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="text-base md:text-sm"
          />
        </InputGroup>
      ) : null}

      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className={cn(
          layout === "grid" ? "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2",
        )}
      >
        {filtered.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "group relative flex min-h-12 w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm outline-none transition-colors",
                "focus-visible:ring-3 focus-visible:ring-ring/40",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
              )}
            >
              {opt.icon ? (
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md [&_svg]:size-4",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {opt.icon}
                </span>
              ) : null}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium leading-snug text-balance">{opt.label}</span>
                {opt.hint ? <span className="text-xs text-muted-foreground">{opt.hint}</span> : null}
              </span>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background",
                )}
                aria-hidden="true"
              >
                {active ? <Check className="size-3.5" /> : null}
              </span>
            </button>
          )
        })}
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
            No matches for &ldquo;{query}&rdquo;.
          </p>
        ) : null}
      </div>
    </div>
  )
}
