"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown, Building2, Mail, Pencil, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  REFERRAL_LOCATIONS,
  HQ_DEPARTMENTS,
  REFERRAL_DISTRICT_DESTINATION,
  REFERRAL_HQ_DESTINATION,
  referralLocationById,
  hqDepartmentById,
  isValidEmail,
} from "@/lib/nira"

export interface ReferralValue {
  officeId: string
  departmentId: string
  email: string
}

interface Props {
  destination: string
  value: ReferralValue
  onChange: (patch: Partial<ReferralValue>) => void
}

/**
 * Conditional referral-destination capture. Reveals only the fields required
 * for the chosen destination and collapses to an editable summary once the
 * precise receiving office/department has been captured.
 */
export function ReferralDestinationFields({ destination, value, onChange }: Props) {
  const [officeOpen, setOfficeOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [officeQuery, setOfficeQuery] = useState("")

  const activeOffices = useMemo(() => REFERRAL_LOCATIONS.filter((l) => l.active), [])
  const activeDepartments = useMemo(() => HQ_DEPARTMENTS.filter((d) => d.active), [])

  // Region order as it appears in master data, used to group search results.
  const regionOrder = useMemo(() => {
    const seen: string[] = []
    for (const l of activeOffices) if (!seen.includes(l.region)) seen.push(l.region)
    return seen
  }, [activeOffices])

  // Search-first behaviour: only surface offices that match what the user has
  // typed, so the dropdown never dumps the full 27-office list over the screen.
  const officeSearch = officeQuery.trim().toLowerCase()
  const officeGroups = useMemo(() => {
    if (!officeSearch) return []
    const matches = activeOffices.filter((l) => `${l.name} ${l.region}`.toLowerCase().includes(officeSearch))
    return regionOrder
      .map((region) => ({ region, items: matches.filter((m) => m.region === region) }))
      .filter((g) => g.items.length > 0)
  }, [activeOffices, regionOrder, officeSearch])

  if (destination === REFERRAL_DISTRICT_DESTINATION) {
    const selected = referralLocationById(value.officeId)

    // Collapsed summary once an office is chosen (and not actively editing).
    if (selected && !editing) {
      return (
        <SummaryCard
          icon={<Building2 className="size-4" />}
          lines={[`NIRA – ${selected.name} District Office`, `${selected.region} region`]}
          onChange={() => {
            setEditing(true)
            setOfficeOpen(true)
          }}
        />
      )
    }

    return (
      <Field className="mt-3">
        <FieldLabel htmlFor="referral-office-trigger">
          Select NIRA District Office <span className="text-destructive">*</span>
        </FieldLabel>
        <Popover
          open={officeOpen}
          onOpenChange={(o) => {
            setOfficeOpen(o)
            if (!o) setOfficeQuery("")
          }}
        >
          <PopoverTrigger
            render={
              <Button
                id="referral-office-trigger"
                variant="outline"
                role="combobox"
                aria-expanded={officeOpen}
                className="h-11 w-full justify-between font-normal sm:w-96"
              >
                <span className={cn(!selected && "text-muted-foreground")}>
                  {selected ? selected.name : "Search district or Kampala Division..."}
                </span>
                <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
              </Button>
            }
          />
          <PopoverContent className="w-72 p-0 sm:w-96" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                value={officeQuery}
                onValueChange={setOfficeQuery}
                placeholder="Type a district or division..."
              />
              {/* Cap the height so results scroll within a bounded box instead of
                  covering the screen; nothing renders until the user searches. */}
              <CommandList className="max-h-56">
                {!officeSearch ? (
                  <div className="flex items-start gap-2 px-3 py-6 text-sm text-muted-foreground">
                    <Search className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Start typing to search {activeOffices.length} district &amp; division offices. Results are grouped
                      by region.
                    </span>
                  </div>
                ) : officeGroups.length === 0 ? (
                  <CommandEmpty>No matching office found.</CommandEmpty>
                ) : (
                  officeGroups.map((group) => (
                    <CommandGroup key={group.region} heading={`${group.region} region`}>
                      {group.items.map((loc) => (
                        <CommandItem
                          key={loc.id}
                          value={loc.id}
                          onSelect={() => {
                            onChange({ officeId: loc.id })
                            setOfficeOpen(false)
                            setOfficeQuery("")
                            setEditing(false)
                          }}
                        >
                          <Check className={cn("size-4", value.officeId === loc.id ? "opacity-100" : "opacity-0")} />
                          <span className="flex-1">{loc.name}</span>
                          <span className="text-xs text-muted-foreground">{loc.region}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <FieldDescription>
          The referral cannot be issued until the exact receiving office is selected.
        </FieldDescription>
      </Field>
    )
  }

  if (destination === REFERRAL_HQ_DESTINATION) {
    const dept = hqDepartmentById(value.departmentId)
    const emailValue = value.email || dept?.email || ""
    const emailOk = emailValue.length === 0 || isValidEmail(emailValue)

    // Collapsed summary once department + email are captured.
    if (dept && emailValue && emailOk && !editing) {
      return (
        <SummaryCard
          icon={<Building2 className="size-4" />}
          lines={[`NIRA Headquarters · ${dept.name}`, emailValue]}
          onChange={() => setEditing(true)}
        />
      )
    }

    return (
      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <Field>
          <FieldLabel htmlFor="referral-dept">
            Select Receiving Department / Section <span className="text-destructive">*</span>
          </FieldLabel>
          <Select
            value={value.departmentId}
            onValueChange={(v) => {
              const next = hqDepartmentById(v ?? undefined)
              // Auto-populate the official department email on selection.
              onChange({ departmentId: v ?? "", email: next?.email ?? "" })
            }}
          >
            <SelectTrigger id="referral-dept" className="h-11 w-full sm:w-96">
              <SelectValue placeholder="Choose a department or section" />
            </SelectTrigger>
            <SelectContent>
              {activeDepartments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {dept ? (
          <Field>
            <FieldLabel htmlFor="referral-email">
              Department / Section Email Address <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="referral-email"
                type="email"
                inputMode="email"
                className={cn("h-11 pl-9 text-base sm:w-96 md:text-sm", !emailOk && "border-destructive")}
                value={emailValue}
                onChange={(e) => onChange({ email: e.target.value })}
              />
            </div>
            {!emailOk ? (
              <FieldDescription className="text-destructive">Enter a valid email address.</FieldDescription>
            ) : (
              <FieldDescription>
                Official address on file. A copy of this referral is emailed here when the notice is issued.
              </FieldDescription>
            )}
            {dept && emailValue && emailOk ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-1 h-8 w-fit text-xs"
                onClick={() => setEditing(false)}
              >
                <Check data-icon="inline-start" />
                Confirm destination
              </Button>
            ) : null}
          </Field>
        ) : null}
      </div>
    )
  }

  return null
}

function SummaryCard({
  icon,
  lines,
  onChange,
}: {
  icon: React.ReactNode
  lines: string[]
  onChange: () => void
}) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referral destination</span>
        <span className="truncate text-sm font-medium text-foreground">{lines[0]}</span>
        {lines[1] ? <span className="truncate text-xs text-muted-foreground">{lines[1]}</span> : null}
      </div>
      <Button type="button" size="sm" variant="ghost" className="ml-auto h-8 shrink-0 text-xs" onClick={onChange}>
        <Pencil data-icon="inline-start" />
        Change
      </Button>
    </div>
  )
}
