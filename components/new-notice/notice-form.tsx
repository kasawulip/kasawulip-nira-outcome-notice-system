"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Phone,
  User,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Search,
  Calendar,
  History,
  RotateCcw,
  Save,
  FileText,
  Send,
  Loader2,
  Info,
} from "lucide-react"
import { toast } from "sonner"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { SectionCard } from "./section-card"
import { SelectableTile } from "./selectable-tile"
import { ShortcutsHelp } from "./shortcuts-help"
import { SuccessDialog, type IssuedNotice } from "./success-dialog"
import { ServiceIcon } from "@/components/service-icon"
import { NoticePreviewDialog } from "@/components/notice-preview-dialog"
import type { PreviewData } from "@/components/notice-preview"
import { useNetwork } from "@/components/network-context"
import {
  SERVICES,
  DELIVERY_METHODS,
  DESTINATIONS,
  TIMELINES,
  OFFICES,
  CURRENT_OFFICER,
  reasonsForService,
  suggestAction,
  serviceName,
  titleCase,
  isValidUgandaPhone,
  isValidEmail,
  generateNoticeNumber,
  type ServiceId,
  type DeliveryMethod,
} from "@/lib/nira"

const RECENT_SERVICES: ServiceId[] = ["collection", "renewal", "first-registration"]

interface LastValues {
  reasons: string[]
  destination: string
}

export function NoticeForm() {
  const { status: network } = useNetwork()

  // ----- Client details
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [nin, setNin] = useState("")
  const [showNin, setShowNin] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("sms")

  // ----- Service
  const [service, setService] = useState<ServiceId | null>(null)
  const [serviceSearch, setServiceSearch] = useState("")

  // ----- Reasons
  const [reasons, setReasons] = useState<string[]>([])
  const [otherReason, setOtherReason] = useState("")

  // ----- Action / next step
  const [action, setAction] = useState("")
  const [actionEdited, setActionEdited] = useState(false)
  const [destination, setDestination] = useState("")
  const [destinationOffice, setDestinationOffice] = useState("")
  const [destinationOther, setDestinationOther] = useState("")
  const [timeline, setTimeline] = useState("")
  const [timelineDate, setTimelineDate] = useState("")
  const [timelineNum, setTimelineNum] = useState("")
  const [timelineUnit, setTimelineUnit] = useState("working")
  const [additional, setAdditional] = useState("")

  // ----- Meta / flow
  const [now, setNow] = useState<Date | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [issued, setIssued] = useState<IssuedNotice | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [lastValues, setLastValues] = useState<LastValues | null>(null)

  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    phoneRef.current?.focus()
  }, [])

  const emailValid = email.length > 0 && isValidEmail(email)
  const phoneValid = isValidUgandaPhone(phone)
  const phoneError = phone.length > 0 && !phoneValid
  const emailError = email.length > 0 && !emailValid

  // Keep delivery method consistent with email availability
  useEffect(() => {
    if (deliveryMethod === "sms-email" && !emailValid) setDeliveryMethod("sms")
  }, [emailValid, deliveryMethod])

  const availableReasons = useMemo(() => reasonsForService(service), [service])
  const otherReasonSelected = reasons.includes("Other")

  // Auto-suggest action when service/reasons change and officer has not edited it
  useEffect(() => {
    if (actionEdited) return
    setAction(suggestAction(service, reasons))
  }, [service, reasons, actionEdited])

  const additionalRequired = otherReasonSelected || actionEdited || timeline === "Other"

  // ---- Completion tracking (7 required sections)
  const checks = {
    phone: phoneValid,
    name: name.trim().length > 1,
    service: service !== null,
    reason: reasons.length > 0 && (!otherReasonSelected || otherReason.trim().length > 2),
    action: action.trim().length > 3,
    destination:
      destination.length > 0 &&
      (destination !== "Another NIRA office" || destinationOffice.length > 0) &&
      (destination !== "Other" || destinationOther.trim().length > 1),
    timeline:
      timeline.length > 0 &&
      (timeline !== "On a specific date" || timelineDate.length > 0) &&
      (timeline !== "Other" || timelineNum.trim().length > 0),
  }
  const completeCount = Object.values(checks).filter(Boolean).length
  const additionalOk = !additionalRequired || additional.trim().length > 2
  const allComplete = completeCount === 7 && additionalOk

  const anyInput =
    phone || name || email || nin || service || reasons.length || action || destination || timeline || additional

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase()
    if (!q) return SERVICES
    return SERVICES.filter((s) => s.name.toLowerCase().includes(q))
  }, [serviceSearch])

  // ---- Handlers
  const selectService = useCallback(
    (id: ServiceId) => {
      setService(id)
      setReasons([])
      setOtherReason("")
      setActionEdited(false)
    },
    [],
  )

  const toggleReason = (r: string) => {
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
  }

  const resolvedTimeline = () => {
    if (timeline === "On a specific date" && timelineDate) {
      return `On ${new Date(timelineDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`
    }
    if (timeline === "Other" && timelineNum) {
      return `Within ${timelineNum} ${timelineUnit === "working" ? "working" : "calendar"} days`
    }
    return timeline
  }

  const resolvedDestination = () => {
    if (destination === "Another NIRA office" && destinationOffice) return destinationOffice
    if (destination === "Other" && destinationOther) return destinationOther
    return destination
  }

  const resolvedReasons = () =>
    reasons.map((r) => (r === "Other" && otherReason ? `Other: ${otherReason}` : r))

  const buildPreview = (noticeNumber: string): PreviewData => ({
    noticeNumber,
    office: CURRENT_OFFICER.office,
    officer: CURRENT_OFFICER.name,
    officerTitle: CURRENT_OFFICER.title,
    dateLabel: (now ?? new Date()).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    timeLabel: (now ?? new Date()).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    clientName: name,
    phone,
    nin: nin || undefined,
    email: email || undefined,
    serviceName: service ? serviceName(service) : "",
    reasons: resolvedReasons(),
    action,
    destination: resolvedDestination(),
    timeline: resolvedTimeline(),
    additional: additional || undefined,
  })

  const resetForm = useCallback(() => {
    setPhone("")
    setName("")
    setEmail("")
    setNin("")
    setShowNin(false)
    setDeliveryMethod("sms")
    setService(null)
    setServiceSearch("")
    setReasons([])
    setOtherReason("")
    setAction("")
    setActionEdited(false)
    setDestination("")
    setDestinationOffice("")
    setDestinationOther("")
    setTimeline("")
    setTimelineDate("")
    setTimelineNum("")
    setTimelineUnit("working")
    setAdditional("")
    setNow(new Date())
    phoneRef.current?.focus()
  }, [])

  const handleClear = () => {
    if (allComplete || !anyInput) {
      resetForm()
      return
    }
    setConfirmClear(true)
  }

  const previewNumberRef = useRef<string>("")
  const openPreview = () => {
    if (!previewNumberRef.current) previewNumberRef.current = "NIRA-MAK-DRAFT-PREVIEW"
    setPreviewOpen(true)
  }

  const issueNotice = () => {
    if (!allComplete || issuing) return
    setIssuing(true)
    const noticeNumber = generateNoticeNumber(CURRENT_OFFICER.office)
    previewNumberRef.current = noticeNumber
    setLastValues({ reasons, destination })
    setTimeout(() => {
      setIssuing(false)
      setIssued({ data: buildPreview(noticeNumber), deliveryMethod })
    }, 1200)
  }

  const startNextNotice = () => {
    setIssued(null)
    previewNumberRef.current = ""
    resetForm()
  }

  // ---- Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key.toLowerCase() === "n") {
          e.preventDefault()
          startNextNotice()
        } else if (e.key === "1") {
          e.preventDefault()
          selectService("first-registration")
        } else if (e.key === "2") {
          e.preventDefault()
          selectService("renewal")
        } else if (e.key === "3") {
          e.preventDefault()
          selectService("collection")
        } else if (e.key.toLowerCase() === "i") {
          e.preventDefault()
          issueNotice()
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplete, issuing, reasons, destination, deliveryMethod, name, phone, email, nin, service, action, timeline])

  const previewData = buildPreview(previewNumberRef.current || "NIRA-MAK-DRAFT-PREVIEW")

  return (
    <div className="flex flex-col gap-4 pb-28 md:pb-24">
      {/* Info strip */}
      <div className="rounded-xl border border-border bg-card">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-5">
          {[
            { label: "District Office", value: CURRENT_OFFICER.office },
            { label: "Serving Officer", value: CURRENT_OFFICER.name },
            {
              label: "Date",
              value: now ? now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—",
            },
            {
              label: "Time",
              value: now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—",
            },
            { label: "Notice Number", value: "On issuance", muted: true },
          ].map((item) => (
            <div key={item.label} className="bg-card px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className={cn("mt-0.5 truncate text-sm font-semibold", item.muted && "font-normal text-muted-foreground")}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {network === "offline" ? (
        <Alert variant="warning">
          <Info />
          <AlertTitle>You are offline (demo)</AlertTitle>
          <AlertDescription>
            Notices issued now will be queued and delivered automatically once the connection is restored.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Section A: Client details */}
      <SectionCard step="A" title="Client Details" complete={checks.phone && checks.name}>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field data-invalid={phoneError || undefined}>
              <FieldLabel htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </FieldLabel>
              <InputGroup className="h-11">
                <InputGroupAddon>
                  <Phone />
                </InputGroupAddon>
                <InputGroupInput
                  id="phone"
                  ref={phoneRef}
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="0772 123456 or +256 772 123456"
                  className="text-base md:text-sm"
                  aria-invalid={phoneError || undefined}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {phoneValid ? (
                  <InputGroupAddon align="inline-end">
                    <ShieldCheck className="text-success" />
                  </InputGroupAddon>
                ) : null}
              </InputGroup>
              {phoneError ? (
                <FieldError>Enter a valid Ugandan mobile number, e.g. 0772 123456.</FieldError>
              ) : (
                <FieldDescription>Uganda (+256). Used to send the SMS notice.</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="name">
                Client Full Name <span className="text-destructive">*</span>
              </FieldLabel>
              <InputGroup className="h-11">
                <InputGroupAddon>
                  <User />
                </InputGroupAddon>
                <InputGroupInput
                  id="name"
                  autoComplete="off"
                  placeholder="e.g. Sarah Nakato"
                  className="text-base md:text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => name && setName(titleCase(name))}
                />
              </InputGroup>
            </Field>

            <Field data-invalid={emailError || undefined}>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <InputGroup className="h-11">
                <InputGroupAddon>
                  <Mail />
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  type="email"
                  autoComplete="off"
                  placeholder="Optional"
                  className="text-base md:text-sm"
                  aria-invalid={emailError || undefined}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </InputGroup>
              {emailError ? (
                <FieldError>Enter a valid email address, e.g. name@example.com.</FieldError>
              ) : (
                <FieldDescription>The full PDF notice will be emailed to this address.</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="nin">NIN or Application Number</FieldLabel>
              <InputGroup className="h-11">
                <InputGroupAddon>
                  <ShieldCheck />
                </InputGroupAddon>
                <InputGroupInput
                  id="nin"
                  autoComplete="off"
                  placeholder="Optional — kept private"
                  className={cn("text-base md:text-sm", !showNin && nin && "[-webkit-text-security:disc]")}
                  value={nin}
                  onChange={(e) => setNin(e.target.value.toUpperCase())}
                  style={!showNin && nin ? ({ WebkitTextSecurity: "disc" } as React.CSSProperties) : undefined}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={showNin ? "Hide number" : "Show number"}
                    onClick={() => setShowNin((s) => !s)}
                  >
                    {showNin ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>Sensitive — masked on the notice and in the register.</FieldDescription>
            </Field>
          </div>

          <Field>
            <FieldLabel>Preferred Delivery Method</FieldLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {DELIVERY_METHODS.map((m) => {
                const disabled = m.id === "sms-email" && !emailValid
                return (
                  <SelectableTile
                    key={m.id}
                    label={m.label}
                    hint={disabled ? "Add an email first" : undefined}
                    selected={deliveryMethod === m.id}
                    disabled={disabled}
                    onSelect={() => setDeliveryMethod(m.id)}
                  />
                )
              })}
            </div>
          </Field>
        </FieldGroup>
      </SectionCard>

      {/* Section B: Service requested */}
      <SectionCard
        step="B"
        title="Service Requested"
        description="Select the single service the client came in for."
        complete={checks.service}
        action={
          <div className="hidden w-56 sm:block">
            <InputGroup className="h-9">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search service"
                aria-label="Search service"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
              />
            </InputGroup>
          </div>
        }
      >
        {RECENT_SERVICES.length ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <History className="size-3.5" /> Recent
            </span>
            {RECENT_SERVICES.map((id) => (
              <Button
                key={id}
                size="sm"
                variant="outline"
                className="h-7 rounded-full text-xs"
                onClick={() => selectService(id)}
              >
                {serviceName(id)}
              </Button>
            ))}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((s) => (
            <SelectableTile
              key={s.id}
              label={s.name}
              icon={<ServiceIcon name={s.icon} />}
              selected={service === s.id}
              onSelect={() => selectService(s.id)}
            />
          ))}
        </div>
      </SectionCard>

      {/* Section C: Reasons */}
      <SectionCard
        step="C"
        title="Reason Service Could Not Be Completed"
        description={service ? "Select all that apply." : "Select a service first to see relevant reasons."}
        complete={checks.reason}
        disabled={!service}
        action={
          lastValues?.reasons.length ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setReasons(lastValues.reasons)}
            >
              <RotateCcw data-icon="inline-start" />
              Use previous
            </Button>
          ) : null
        }
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {availableReasons.map((r) => (
            <SelectableTile key={r} label={r} multi selected={reasons.includes(r)} onSelect={() => toggleReason(r)} />
          ))}
        </div>
        {otherReasonSelected ? (
          <Field className="mt-3">
            <FieldLabel htmlFor="other-reason">
              Specify the reason <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              id="other-reason"
              rows={2}
              placeholder="Describe the specific reason the service could not be completed."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
            />
          </Field>
        ) : null}
      </SectionCard>

      {/* Section D: Action required */}
      <SectionCard
        step="D"
        title="Action Required / Next Step"
        description="The system suggests an action — edit it if needed."
        complete={checks.action && checks.destination && checks.timeline}
        disabled={!service || reasons.length === 0}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="action">
              Action required <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              id="action"
              rows={3}
              className="text-base md:text-sm"
              placeholder="Describe what the client should do next."
              value={action}
              onChange={(e) => {
                setAction(e.target.value)
                setActionEdited(true)
              }}
            />
            {!actionEdited && action ? (
              <FieldDescription>Auto-suggested from the selected service and reason.</FieldDescription>
            ) : null}
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>
                Where should the client go next? <span className="text-destructive">*</span>
              </FieldLabel>
              {lastValues?.destination ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setDestination(lastValues.destination)}
                >
                  <RotateCcw data-icon="inline-start" />
                  Use previous
                </Button>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {DESTINATIONS.map((d) => (
                <SelectableTile key={d} label={d} selected={destination === d} onSelect={() => setDestination(d)} />
              ))}
            </div>
            {destination === "Another NIRA office" ? (
              <div className="mt-2">
                <Select value={destinationOffice} onValueChange={setDestinationOffice}>
                  <SelectTrigger className="h-10 w-full sm:w-80">
                    <SelectValue placeholder="Search and select the office" />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFICES.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {destination === "Other" ? (
              <Input
                className="mt-2 h-10 sm:w-80"
                placeholder="Specify where the client should go"
                value={destinationOther}
                onChange={(e) => setDestinationOther(e.target.value)}
              />
            ) : null}
          </Field>

          <Field>
            <FieldLabel>
              Expected timeline <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TIMELINES.map((t) => (
                <SelectableTile key={t} label={t} selected={timeline === t} onSelect={() => setTimeline(t)} />
              ))}
            </div>
            {timeline === "On a specific date" ? (
              <div className="mt-2">
                <InputGroup className="h-10 sm:w-64">
                  <InputGroupAddon>
                    <Calendar />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="date"
                    aria-label="Specific date"
                    value={timelineDate}
                    onChange={(e) => setTimelineDate(e.target.value)}
                  />
                </InputGroup>
              </div>
            ) : null}
            {timeline === "Other" ? (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  className="h-10 w-24"
                  placeholder="No."
                  value={timelineNum}
                  onChange={(e) => setTimelineNum(e.target.value)}
                />
                <Select value={timelineUnit} onValueChange={setTimelineUnit}>
                  <SelectTrigger className="h-10 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="working">Working days</SelectItem>
                    <SelectItem value="calendar">Calendar days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </Field>

          <Field data-invalid={(additionalRequired && !additionalOk) || undefined}>
            <FieldLabel htmlFor="additional">
              Additional details explaining why this action is required
              {additionalRequired ? <span className="text-destructive"> *</span> : null}
            </FieldLabel>
            <Textarea
              id="additional"
              rows={2}
              maxLength={400}
              className="text-base md:text-sm"
              placeholder="Optional context for the client and for the case record."
              value={additional}
              onChange={(e) => setAdditional(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <FieldDescription>
                {additionalRequired ? "Required because the action or timeline is non-standard." : "Optional."}
              </FieldDescription>
              <span className="text-xs text-muted-foreground">{additional.length}/400</span>
            </div>
          </Field>
        </FieldGroup>
      </SectionCard>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur peer-data-[state=expanded]:md:left-[--sidebar-width] md:left-[var(--sidebar-width,0)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", allComplete ? "bg-success" : "bg-primary")}
                  style={{ width: `${(completeCount / 7) * 100}%` }}
                />
              </div>
              <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                {completeCount} of 7 sections
              </span>
            </div>
            <div className="ml-auto sm:hidden">
              <ShortcutsHelp />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <div className="hidden sm:block">
              <ShortcutsHelp />
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear} className="hidden sm:inline-flex">
              <RotateCcw data-icon="inline-start" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Draft saved (simulated)")}
              disabled={!anyInput}
            >
              <Save data-icon="inline-start" />
              <span className="hidden sm:inline">Save Draft</span>
              <span className="sm:hidden">Draft</span>
            </Button>
            <Button variant="outline" size="sm" onClick={openPreview} disabled={!service}>
              <FileText data-icon="inline-start" />
              Preview
            </Button>
            <Button
              size="sm"
              className="min-w-32 flex-1 sm:flex-none"
              disabled={!allComplete || issuing}
              onClick={issueNotice}
            >
              {issuing ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
              {issuing ? "Issuing…" : "Issue Notice"}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview dialog */}
      <NoticePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} data={previewData} />

      {/* Success dialog */}
      <SuccessDialog
        issued={issued}
        onNewNotice={startNextNotice}
        onPreview={() => {
          setPreviewOpen(true)
        }}
      />

      {/* Confirm clear */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear this notice?</DialogTitle>
            <DialogDescription>
              This form has unsaved information. Clearing will discard the current entry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Keep editing</DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                resetForm()
                setConfirmClear(false)
              }}
            >
              Clear form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
