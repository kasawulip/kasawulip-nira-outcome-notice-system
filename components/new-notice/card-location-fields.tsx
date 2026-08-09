"use client"

import { useMemo, useState, useId } from "react"
import { Check, ChevronsUpDown, Building2, Mail, MapPin, User, Pencil, AlertTriangle, Search } from "lucide-react"

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
import { REFERRAL_LOCATIONS, referralLocationById } from "@/lib/nira"

export interface CardLocationValue {
  officeId: string
  batch: string
  outreachText: string
  staffName: string
  staffId: string
  staffPhone: string
}

export interface StaffSuggestion {
  id: string
  name: string
  title: string
}

interface Props {
  mode: "district" | "outreach"
  value: CardLocationValue
  onChange: (patch: Partial<CardLocationValue>) => void
  staffSuggestions?: StaffSuggestion[]
}

/**
 * Conditional card-collection capture for "Collection of National ID".
 * Reveals only the fields for the active pathway (another district office vs.
 * a local outreach station) and collapses to an editable summary once the
 * exact card location has been captured.
 */
export function CardLocationFields({ mode, value, onChange, staffSuggestions = [] }: Props) {
  const [officeOpen, setOfficeOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [officeQuery, setOfficeQuery] = useState("")
  const staffListId = useId()

  const activeOffices = useMemo(() => REFERRAL_LOCATIONS.filter((l) => l.active), [])

  // Region order (from master-data order) used to group search results.
  const regionOrder = useMemo(() => {
    const seen: string[] = []
    for (const l of activeOffices) if (!seen.includes(l.region)) seen.push(l.region)
    return seen
  }, [activeOffices])

  // Search-first: surface only offices matching the typed query so the large
  // national list never floods the screen on open.
  const officeSearch = officeQuery.trim().toLowerCase()
  const officeGroups = useMemo(() => {
    if (!officeSearch) return []
    const matches = activeOffices.filter((l) => `${l.name} ${l.region}`.toLowerCase().includes(officeSearch))
    return regionOrder
      .map((region) => ({ region, items: matches.filter((m) => m.region === region) }))
      .filter((g) => g.items.length > 0)
  }, [activeOffices, regionOrder, officeSearch])

  if (mode === "district") {
    const selected = referralLocationById(value.officeId)
    const officeEmail = selected?.email
    const emailConfigured = Boolean(officeEmail)
    const complete = Boolean(selected && emailConfigured && value.batch.trim().length > 0)

    if (complete && !editing) {
      return (
        <SummaryCard
          icon={<Building2 className="size-4" />}
          heading="Card location"
          lines={[
            `NIRA ${selected!.name} District Office`,
            `Batch ${value.batch} · ${officeEmail}`,
          ]}
          onChange={() => setEditing(true)}
        />
      )
    }

    return (
      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <Field>
          <FieldLabel htmlFor="card-office-trigger">
            District Office Where Card Is Located <span className="text-destructive">*</span>
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
                  id="card-office-trigger"
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
                {/* Height-capped so results scroll in a bounded box; nothing
                    renders until the user searches. */}
                <CommandList className="max-h-56">
                  {!officeSearch ? (
                    <div className="flex items-start gap-2 px-3 py-6 text-sm text-muted-foreground">
                      <Search className="mt-0.5 size-4 shrink-0" />
                      <span>
                        Start typing to search {activeOffices.length} district &amp; division offices. Results are
                        grouped by region.
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
        </Field>

        <Field>
          <FieldLabel htmlFor="card-batch">
            Batch Number <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="card-batch"
            className="h-11 text-base sm:w-72 md:text-sm"
            placeholder="e.g. WKSO-2026-0147"
            value={value.batch}
            autoCapitalize="characters"
            onChange={(e) => onChange({ batch: e.target.value.toUpperCase() })}
          />
          <FieldDescription>The batch under which the client&apos;s card is held.</FieldDescription>
        </Field>

        {selected ? (
          <Field>
            <FieldLabel htmlFor="card-office-email">Receiving District Office Email</FieldLabel>
            {emailConfigured ? (
              <>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="card-office-email"
                    readOnly
                    className="h-11 cursor-default bg-muted pl-9 text-base sm:w-96 md:text-sm"
                    value={officeEmail}
                    aria-describedby="card-office-email-desc"
                  />
                </div>
                <FieldDescription id="card-office-email-desc">
                  Official address on file. The receiving office is emailed a copy of this referral when the notice is
                  issued.
                </FieldDescription>
              </>
            ) : (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  No official email configured for this office. An authorised administrator must add it to the office
                  master data before a card referral can be issued here.
                </span>
              </div>
            )}
          </Field>
        ) : null}
      </div>
    )
  }

  // Outreach / service station within the officer's own district.
  const staffMatch = staffSuggestions.find((s) => s.name.toLowerCase() === value.staffName.trim().toLowerCase())
  const complete = value.outreachText.trim().length > 2 && value.batch.trim().length > 0 && value.staffName.trim().length > 1

  if (complete && !editing) {
    return (
      <SummaryCard
        icon={<MapPin className="size-4" />}
        heading="Card location"
        lines={[value.outreachText, `Batch ${value.batch} · Contact: ${value.staffName}`]}
        onChange={() => setEditing(true)}
      />
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <Field>
        <FieldLabel htmlFor="outreach-location">
          Enter exact outreach/service station location <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="outreach-location"
          className="h-11 text-base sm:w-96 md:text-sm"
          placeholder="e.g. Kiswa Health Centre IV, Bugolobi"
          value={value.outreachText}
          onChange={(e) => onChange({ outreachText: e.target.value })}
        />
        <FieldDescription>Enough detail for the client to locate the station without further help.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="outreach-batch">
          Batch Number <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="outreach-batch"
          className="h-11 text-base sm:w-72 md:text-sm"
          placeholder="e.g. KLA-2026-083"
          value={value.batch}
          autoCapitalize="characters"
          onChange={(e) => onChange({ batch: e.target.value.toUpperCase() })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="outreach-staff">
          Name of NIRA Staff Member / Officer to Contact <span className="text-destructive">*</span>
        </FieldLabel>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="outreach-staff"
            list={staffSuggestions.length ? staffListId : undefined}
            className="h-11 pl-9 text-base sm:w-96 md:text-sm"
            placeholder="Staff member the client should ask for"
            value={value.staffName}
            onChange={(e) => {
              const name = e.target.value
              const match = staffSuggestions.find((s) => s.name.toLowerCase() === name.trim().toLowerCase())
              onChange({ staffName: name, staffId: match?.id ?? "" })
            }}
          />
          {staffSuggestions.length ? (
            <datalist id={staffListId}>
              {staffSuggestions.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.title}
                </option>
              ))}
            </datalist>
          ) : null}
        </div>
        <FieldDescription>
          {staffMatch
            ? `Matched to ${staffMatch.title} on staff records.`
            : "Select an assigned staff member or type the responsible officer's name."}
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="outreach-phone">Staff Contact Number (optional)</FieldLabel>
        <Input
          id="outreach-phone"
          type="tel"
          inputMode="tel"
          className="h-11 text-base sm:w-72 md:text-sm"
          placeholder="Only where policy permits it on the notice"
          value={value.staffPhone}
          onChange={(e) => onChange({ staffPhone: e.target.value })}
        />
      </Field>
    </div>
  )
}

function SummaryCard({
  icon,
  heading,
  lines,
  onChange,
}: {
  icon: React.ReactNode
  heading: string
  lines: string[]
  onChange: () => void
}) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{heading}</span>
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
