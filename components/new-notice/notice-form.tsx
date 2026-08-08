"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Phone,
  User,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Calendar,
  RotateCcw,
  FileText,
  Send,
  Loader2,
  Info,
} from "lucide-react"
import { toast } from "sonner"

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { DisclosureSelect, type DisclosureOption } from "./disclosure-select"
import { ReferralDestinationFields } from "./referral-destination-fields"
import { CardLocationFields, type CardLocationValue } from "./card-location-fields"
import { SuccessDialog, type IssuedNotice } from "./success-dialog"
import { ServiceIcon } from "@/components/service-icon"
import { NoticePreviewDialog } from "@/components/notice-preview-dialog"
import type { PreviewData } from "@/components/notice-preview"
import { useNetwork } from "@/components/network-context"
import { useSession } from "@/components/session-context"
import { useDataStore } from "@/components/data-store-context"
import {
  SERVICES,
  DELIVERY_METHODS,
  DESTINATIONS,
  TIMELINES,
  DISTRICTS,
  ALL_DISTRICTS,
  REFERRAL_DISTRICT_DESTINATION,
  REFERRAL_HQ_DESTINATION,
  CARD_AT_DISTRICT_REASON,
  CARD_AT_OUTREACH_REASON,
  reasonsForService,
  suggestAction,
  serviceName,
  titleCase,
  isValidUgandaPhone,
  isValidEmail,
  generateNoticeNumber,
  generateRetrievalToken,
  noticeVerifyUrl,
  referralLocationById,
  hqDepartmentById,
  type ServiceId,
  type DeliveryMethod,
  type NoticeRecord,
  type ReferralEmailStatus,
  type CardLocationType,
} from "@/lib/nira"

const DRAFT_KEY = "nira.draft"

interface LastValues {
  reasons: string[]
  destination: string
}

export function NoticeForm() {
  const { status: network, isOnline } = useNetwork()
  const { account } = useSession()
  const {
    issueNotice: persistNotice,
    channelSettings,
    sendReferralEmail: dispatchReferralEmail,
    accounts,
  } = useDataStore()

  const isAdmin = account?.role === "systems-admin"
  const fixedOffice = account && account.district !== ALL_DISTRICTS ? account.district : ""

  // ----- Office (fixed for staff, selectable for admin)
  const [office, setOffice] = useState(fixedOffice)

  // ----- Client details
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [nin, setNin] = useState("")
  const [showNin, setShowNin] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("sms")

  // ----- Service / reasons / action
  const [service, setService] = useState<ServiceId | null>(null)
  const [reasons, setReasons] = useState<string[]>([])
  const [otherReason, setOtherReason] = useState("")
  // Card-collection referral capture (see CardLocationFields).
  const emptyCardLocation: CardLocationValue = {
    officeId: "",
    batch: "",
    outreachText: "",
    staffName: "",
    staffId: "",
    staffPhone: "",
  }
  const [cardLocation, setCardLocation] = useState<CardLocationValue>(emptyCardLocation)
  const [action, setAction] = useState("")
  const [actionEdited, setActionEdited] = useState(false)
  const [destination, setDestination] = useState("")
  const [destinationOther, setDestinationOther] = useState("")
  // Precise referral capture (see ReferralDestinationFields).
  const [referralOfficeId, setReferralOfficeId] = useState("")
  const [referralDepartmentId, setReferralDepartmentId] = useState("")
  const [referralEmail, setReferralEmail] = useState("")
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
  const hydratedRef = useRef(false)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  // ----- Draft persistence (resume after reload / offline)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        setPhone(d.phone ?? "")
        setName(d.name ?? "")
        setEmail(d.email ?? "")
        setNin(d.nin ?? "")
        setDeliveryMethod(d.deliveryMethod ?? "sms")
        setService(d.service ?? null)
        setReasons(d.reasons ?? [])
        setOtherReason(d.otherReason ?? "")
        setAction(d.action ?? "")
        setActionEdited(d.actionEdited ?? false)
        setDestination(d.destination ?? "")
        setDestinationOther(d.destinationOther ?? "")
        setReferralOfficeId(d.referralOfficeId ?? "")
        setReferralDepartmentId(d.referralDepartmentId ?? "")
        setReferralEmail(d.referralEmail ?? "")
        if (d.cardLocation) {
          setCardLocation({
            officeId: d.cardLocation.officeId ?? "",
            batch: d.cardLocation.batch ?? "",
            outreachText: d.cardLocation.outreachText ?? "",
            staffName: d.cardLocation.staffName ?? "",
            staffId: d.cardLocation.staffId ?? "",
            staffPhone: d.cardLocation.staffPhone ?? "",
          })
        }
        setTimeline(d.timeline ?? "")
        setTimelineDate(d.timelineDate ?? "")
        setTimelineNum(d.timelineNum ?? "")
        setTimelineUnit(d.timelineUnit ?? "working")
        setAdditional(d.additional ?? "")
        if (d.office) setOffice(d.office)
      }
    } catch {
      // ignore
    }
    hydratedRef.current = true
  }, [])

  const emailValid = email.length > 0 && isValidEmail(email)
  const phoneValid = isValidUgandaPhone(phone)
  const phoneError = phone.length > 0 && !phoneValid
  const emailError = email.length > 0 && !emailValid

  useEffect(() => {
    if (deliveryMethod === "sms-email" && !emailValid) setDeliveryMethod("sms")
  }, [emailValid, deliveryMethod])

  const availableReasons = useMemo(() => reasonsForService(service), [service])
  const otherReasonSelected = reasons.includes("Other")

  // Card-collection pathways (mutually exclusive, collection service only).
  const cardAtDistrict = service === "collection" && reasons.includes(CARD_AT_DISTRICT_REASON)
  const cardAtOutreach = service === "collection" && reasons.includes(CARD_AT_OUTREACH_REASON)

  // Same-district active staff offered as outreach contact suggestions.
  const staffSuggestions = useMemo(
    () =>
      accounts
        .filter((a) => a.active && a.role === "district-staff" && a.district === office && a.name !== account?.name)
        .map((a) => ({ id: a.id, name: a.name, title: a.title })),
    [accounts, office, account?.name],
  )

  useEffect(() => {
    if (actionEdited) return
    setAction(suggestAction(service, reasons))
  }, [service, reasons, actionEdited])

  // Clear obsolete card-location child fields whenever the active pathway
  // changes so stale office/email/batch/location/staff can never leak through.
  useEffect(() => {
    if (!hydratedRef.current) return
    if (!cardAtDistrict && !cardAtOutreach) {
      setCardLocation((prev) => {
        const anySet = prev.officeId || prev.batch || prev.outreachText || prev.staffName || prev.staffId || prev.staffPhone
        return anySet ? { ...emptyCardLocation } : prev
      })
      return
    }
    if (cardAtDistrict) {
      // District path keeps officeId + batch; drop any outreach-only values.
      setCardLocation((prev) =>
        prev.outreachText || prev.staffName || prev.staffId || prev.staffPhone
          ? { ...prev, outreachText: "", staffName: "", staffId: "", staffPhone: "" }
          : prev,
      )
    }
    if (cardAtOutreach) {
      // Outreach path keeps outreach/staff + batch; drop any district office id.
      setCardLocation((prev) => (prev.officeId ? { ...prev, officeId: "" } : prev))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardAtDistrict, cardAtOutreach])

  // Clear obsolete referral child fields whenever the destination changes so
  // stale office/department values can never leak into the issued referral.
  useEffect(() => {
    if (!hydratedRef.current) return
    if (destination !== REFERRAL_DISTRICT_DESTINATION && referralOfficeId) setReferralOfficeId("")
    if (destination !== REFERRAL_HQ_DESTINATION && (referralDepartmentId || referralEmail)) {
      setReferralDepartmentId("")
      setReferralEmail("")
    }
    if (destination !== "Other" && destinationOther) setDestinationOther("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination])

  const additionalRequired = otherReasonSelected || actionEdited || timeline === "Other"

  const checks = {
    phone: phoneValid,
    name: name.trim().length > 1,
    service: service !== null,
    reason:
      reasons.length > 0 &&
      (!otherReasonSelected || otherReason.trim().length > 2) &&
      // District card path: exact office + batch + an office with a configured email.
      (!cardAtDistrict ||
        (cardLocation.officeId.length > 0 &&
          cardLocation.batch.trim().length > 0 &&
          Boolean(referralLocationById(cardLocation.officeId)?.email))) &&
      // Outreach card path: location + batch + contact staff member.
      (!cardAtOutreach ||
        (cardLocation.outreachText.trim().length > 2 &&
          cardLocation.batch.trim().length > 0 &&
          cardLocation.staffName.trim().length > 1)),
    action: action.trim().length > 3,
    destination:
      destination.length > 0 &&
      (destination !== REFERRAL_DISTRICT_DESTINATION || referralOfficeId.length > 0) &&
      (destination !== REFERRAL_HQ_DESTINATION ||
        (referralDepartmentId.length > 0 && referralEmail.length > 0 && isValidEmail(referralEmail))) &&
      (destination !== "Other" || destinationOther.trim().length > 1),
    timeline:
      timeline.length > 0 &&
      (timeline !== "On a specific date" || timelineDate.length > 0) &&
      (timeline !== "Other" || timelineNum.trim().length > 0),
  }
  const completeCount = Object.values(checks).filter(Boolean).length
  const additionalOk = !additionalRequired || additional.trim().length > 2
  const officeOk = office.length > 0
  const allComplete = completeCount === 7 && additionalOk && officeOk

  const anyInput =
    phone || name || email || nin || service || reasons.length || action || destination || timeline || additional

  // Persist draft whenever inputs change (after hydration).
  useEffect(() => {
    if (!hydratedRef.current) return
    if (!anyInput) {
      localStorage.removeItem(DRAFT_KEY)
      return
    }
    const draft = {
      office,
      phone,
      name,
      email,
      nin,
      deliveryMethod,
      service,
      reasons,
      otherReason,
      action,
      actionEdited,
      destination,
      destinationOther,
      referralOfficeId,
      referralDepartmentId,
      referralEmail,
      cardLocation,
      timeline,
      timelineDate,
      timelineNum,
      timelineUnit,
      additional,
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // ignore
    }
  }, [
    office,
    phone,
    name,
    email,
    nin,
    deliveryMethod,
    service,
    reasons,
    otherReason,
    action,
    actionEdited,
    destination,
    destinationOther,
    referralOfficeId,
    referralDepartmentId,
    referralEmail,
    cardLocation,
    timeline,
    timelineDate,
    timelineNum,
    timelineUnit,
    additional,
    anyInput,
  ])

  // ----- Options for progressive-disclosure sections
  const serviceOptions: DisclosureOption[] = useMemo(
    () => SERVICES.map((s) => ({ value: s.id, label: s.name, icon: <ServiceIcon name={s.icon} /> })),
    [],
  )
  const destinationOptions: DisclosureOption[] = useMemo(
    () => DESTINATIONS.map((d) => ({ value: d, label: d })),
    [],
  )
  const timelineOptions: DisclosureOption[] = useMemo(() => TIMELINES.map((t) => ({ value: t, label: t })), [])

  const deliveryMethods = useMemo(
    () =>
      DELIVERY_METHODS.filter((m) => {
        if (m.id === "print") return channelSettings.print
        if (m.id === "sms") return channelSettings.sms
        if (m.id === "sms-email") return channelSettings.sms && channelSettings.email
        return true
      }),
    [channelSettings],
  )

  // ----- Handlers
  const selectService = useCallback((id: string) => {
    setService(id as ServiceId)
    setReasons([])
    setOtherReason("")
    setCardLocation({ officeId: "", batch: "", outreachText: "", staffName: "", staffId: "", staffPhone: "" })
    setActionEdited(false)
  }, [])

  const toggleReason = (r: string) => {
    setReasons((prev) => {
      if (prev.includes(r)) return prev.filter((x) => x !== r)
      let next = [...prev, r]
      // The two card-collection pathways are mutually exclusive.
      if (r === CARD_AT_DISTRICT_REASON) next = next.filter((x) => x !== CARD_AT_OUTREACH_REASON)
      if (r === CARD_AT_OUTREACH_REASON) next = next.filter((x) => x !== CARD_AT_DISTRICT_REASON)
      return next
    })
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
    if (destination === REFERRAL_DISTRICT_DESTINATION) {
      const loc = referralLocationById(referralOfficeId)
      return loc ? `NIRA – ${loc.name} District Office` : destination
    }
    if (destination === REFERRAL_HQ_DESTINATION) {
      const dept = hqDepartmentById(referralDepartmentId)
      return dept ? `NIRA Headquarters – ${dept.name}` : destination
    }
    if (destination === "Other" && destinationOther) return destinationOther
    return destination
  }

  const resolvedReasons = () => reasons.map((r) => (r === "Other" && otherReason ? `Other: ${otherReason}` : r))

  const buildPreview = (noticeNumber: string): PreviewData => ({
    noticeNumber,
    office,
    officer: account?.name ?? "",
    officerTitle: account?.title ?? "Registration Officer",
    dateLabel: (now ?? new Date()).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    timeLabel: (now ?? new Date()).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    clientName: name,
    phone,
    nin: nin || undefined,
    email: email || undefined,
    serviceName: service ? serviceName(service) : "",
    reasons: resolvedReasons(),
    action,
    destination: resolvedDestination(),
    referralEmail:
      destination === REFERRAL_HQ_DESTINATION
        ? referralEmail || hqDepartmentById(referralDepartmentId)?.email
        : undefined,
    ...cardPreviewFields(),
    timeline: resolvedTimeline(),
    additional: additional || undefined,
  })

  // Card-collection preview fields derived from current form state.
  const cardPreviewFields = (): Partial<PreviewData> => {
    if (cardAtDistrict) {
      const office = referralLocationById(cardLocation.officeId)
      if (!office) return {}
      return {
        cardLocationType: "DISTRICT_OFFICE",
        cardLocationLabel: `NIRA – ${office.name} District Office`,
        cardBatchNumber: cardLocation.batch.trim() || undefined,
        cardReceivingEmail: office.email,
      }
    }
    if (cardAtOutreach) {
      const staffTitle = staffSuggestions.find((s) => s.id === cardLocation.staffId)?.title
      const contact = cardLocation.staffName.trim()
        ? [cardLocation.staffName.trim(), staffTitle].filter(Boolean).join(" – ") +
          (cardLocation.staffPhone.trim() ? ` · ${cardLocation.staffPhone.trim()}` : "")
        : undefined
      return {
        cardLocationType: "LOCAL_OUTREACH",
        cardLocationLabel: cardLocation.outreachText.trim() || undefined,
        cardBatchNumber: cardLocation.batch.trim() || undefined,
        cardContactPerson: contact,
      }
    }
    return {}
  }

  const resetForm = useCallback(() => {
    setPhone("")
    setName("")
    setEmail("")
    setNin("")
    setShowNin(false)
    setDeliveryMethod("sms")
    setService(null)
    setReasons([])
    setOtherReason("")
    setCardLocation({ officeId: "", batch: "", outreachText: "", staffName: "", staffId: "", staffPhone: "" })
    setAction("")
    setActionEdited(false)
    setDestination("")
    setDestinationOther("")
    setReferralOfficeId("")
    setReferralDepartmentId("")
    setReferralEmail("")
    setTimeline("")
    setTimelineDate("")
    setTimelineNum("")
    setTimelineUnit("working")
    setAdditional("")
    setNow(new Date())
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
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
    if (!previewNumberRef.current) previewNumberRef.current = "CR-DRAFT-PREVIEW"
    setPreviewOpen(true)
  }

  const doIssue = () => {
    if (!allComplete || issuing) return
    setIssuing(true)
    const online = isOnline
    const noticeNumber = generateNoticeNumber(office)
    const retrievalToken = generateRetrievalToken()
    previewNumberRef.current = noticeNumber
    setLastValues({ reasons, destination })

    // Resolve referral metadata (stored by stable id, never display name only).
    const isDistrictReferral = destination === REFERRAL_DISTRICT_DESTINATION
    const isHqReferral = destination === REFERRAL_HQ_DESTINATION
    const hqDept = isHqReferral ? hqDepartmentById(referralDepartmentId) : undefined

    // Resolve card-collection referral snapshot (values frozen at issue time so
    // later master-data edits never change historic notices).
    const cardOffice = cardAtDistrict ? referralLocationById(cardLocation.officeId) : undefined
    const cardLocationType: CardLocationType | undefined = cardAtDistrict
      ? "DISTRICT_OFFICE"
      : cardAtOutreach
        ? "LOCAL_OUTREACH"
        : undefined

    // A single receiving email drives the send/resend machinery: the receiving
    // district office for a card referral, else the HQ department for an HQ
    // destination referral. Card referrals to a district take precedence.
    const activeReferralEmail = cardAtDistrict
      ? cardOffice?.email
      : isHqReferral
        ? referralEmail || hqDept?.email
        : undefined
    // Start pending so the status can be flipped to sent/failed after delivery.
    const referralEmailStatus: ReferralEmailStatus = activeReferralEmail ? "pending" : "not-required"

    const record: NoticeRecord = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `n-${crypto.randomUUID()}`
          : `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      noticeNumber,
      dateTime: new Date().toISOString(),
      clientName: name,
      phone,
      email: email || undefined,
      nin: nin || undefined,
      service: service as ServiceId,
      reasons: resolvedReasons(),
      action,
      destination: resolvedDestination(),
      referralDestinationType: isDistrictReferral ? "DISTRICT_OFFICE" : isHqReferral ? "HEADQUARTERS" : undefined,
      referralOfficeId: isDistrictReferral ? referralOfficeId || undefined : undefined,
      referralDepartmentId: isHqReferral ? referralDepartmentId || undefined : undefined,
      referralEmail: activeReferralEmail || undefined,
      referralEmailStatus: activeReferralEmail ? referralEmailStatus : undefined,
      // Card-collection referral snapshot.
      cardLocationType,
      cardLocationOfficeId: cardAtDistrict ? cardLocation.officeId || undefined : undefined,
      cardLocationText: cardAtDistrict
        ? cardOffice
          ? `NIRA ${cardOffice.name} District Office`
          : undefined
        : cardAtOutreach
          ? cardLocation.outreachText || undefined
          : undefined,
      cardBatchNumber: cardLocationType ? cardLocation.batch.trim() || undefined : undefined,
      receivingOfficeEmail: cardAtDistrict ? cardOffice?.email : undefined,
      outreachContactStaffName: cardAtOutreach ? cardLocation.staffName.trim() || undefined : undefined,
      outreachContactStaffId: cardAtOutreach ? cardLocation.staffId || undefined : undefined,
      outreachContactStaffPhone: cardAtOutreach ? cardLocation.staffPhone.trim() || undefined : undefined,
      timeline: resolvedTimeline(),
      additional: additional || undefined,
      officer: account?.name ?? "",
      office,
      deliveryMethod,
      smsStatus: deliveryMethod === "print" ? "Pending" : online ? "Sent" : "Queued",
      emailStatus: deliveryMethod === "sms-email" ? (online ? "Sent" : "Queued") : undefined,
      pdfStatus: online ? "Generated" : "Pending",
      caseStatus: "Awaiting Client Action",
      priority: "Medium",
      retrievalToken,
      trackingStatus: "ISSUED",
    }

    setTimeout(() => {
      const { queued } = persistNotice(record, { online })
      setIssuing(false)
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {
        // ignore
      }
      if (queued) {
        toast.warning("Saved & queued — will send when back online")
      } else {
        toast.success("Notice issued — delivery confirming in the background")
      }
      // Save the referral first (done above), then attempt the receiving-office
      // email. Email failure never loses the referral — it is flagged for resend.
      if (activeReferralEmail && !queued) {
        const target = cardAtDistrict ? "receiving district office" : "receiving department"
        void dispatchReferralEmail(record.id).then((sent) => {
          if (sent) {
            toast.success(`Referral emailed to ${target}`, { description: activeReferralEmail })
          } else {
            toast.error("Referral email delivery failed", {
              description: "Flagged as pending — resend it from the register.",
            })
          }
        })
      }
      const verifyUrl = noticeVerifyUrl(retrievalToken)
      setIssued({
        data: { ...buildPreview(noticeNumber), verifyUrl },
        deliveryMethod,
        queued,
        verifyUrl,
      })
    }, 900)
  }

  const startNextNotice = () => {
    setIssued(null)
    previewNumberRef.current = ""
    resetForm()
  }

    const previewData = buildPreview(previewNumberRef.current || "CR-DRAFT-PREVIEW")

  if (!account) return null

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-3 py-4 pb-28 sm:px-4 md:pb-24 lg:max-w-4xl">
      {/* Meta strip */}
      <div className="rounded-xl border border-border bg-card">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-4">
          {[
            { label: "Serving Officer", value: account.name },
            {
              label: "Date",
              value: now ? now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
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
        <Alert className="border-warning/40 bg-warning/10 text-foreground [&>svg]:text-warning">
          <Info />
          <AlertTitle>You are offline</AlertTitle>
          <AlertDescription>
            Notices you issue now are saved to a draft queue and sent automatically once the connection returns.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Admin office selection */}
      {isAdmin ? (
        <SectionCard step="•" title="Issuing Office" description="Select the district office this notice is issued for." complete={officeOk}>
          <DisclosureSelect
            ariaLabel="Issuing office"
            layout="grid"
            options={DISTRICTS.map((d) => ({ value: d.name, label: d.name, hint: d.code }))}
            value={office || null}
            onChange={setOffice}
          />
        </SectionCard>
      ) : null}

      {/* Section A: Client details */}
      <SectionCard step="A" title="Client Details" complete={checks.phone && checks.name}>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field data-invalid={phoneError || undefined}>
              <FieldLabel htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </FieldLabel>
              <InputGroup className="h-12 md:h-11">
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
              <InputGroup className="h-12 md:h-11">
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
              <InputGroup className="h-12 md:h-11">
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
              <InputGroup className="h-12 md:h-11">
                <InputGroupAddon>
                  <ShieldCheck />
                </InputGroupAddon>
                <InputGroupInput
                  id="nin"
                  autoComplete="off"
                  placeholder="Optional — kept private"
                  className="text-base md:text-sm"
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
              {deliveryMethods.map((m) => {
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

      {/* Section B: Service requested (progressive disclosure) */}
      <SectionCard
        step="B"
        title="Service Requested"
        description="Select the single service the client came in for."
        complete={checks.service}
      >
        <DisclosureSelect
          ariaLabel="Service requested"
          layout="grid"
          searchable
          searchPlaceholder="Search service"
          options={serviceOptions}
          value={service}
          onChange={selectService}
        />
      </SectionCard>

      {/* Section C: Reasons (multi-select) */}
      <SectionCard
        step="C"
        title="Reason Service Could Not Be Completed"
        description={service ? "Select all that apply." : "Select a service first to see relevant reasons."}
        complete={checks.reason}
        disabled={!service}
        action={
          lastValues?.reasons.length ? (
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setReasons(lastValues.reasons)}>
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
        {cardAtDistrict ? (
          <CardLocationFields mode="district" value={cardLocation} onChange={(patch) => setCardLocation((prev) => ({ ...prev, ...patch }))} />
        ) : null}
        {cardAtOutreach ? (
          <CardLocationFields
            mode="outreach"
            value={cardLocation}
            staffSuggestions={staffSuggestions}
            onChange={(patch) => setCardLocation((prev) => ({ ...prev, ...patch }))}
          />
        ) : null}
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
                  className="h-8 text-xs"
                  onClick={() => setDestination(lastValues.destination)}
                >
                  <RotateCcw data-icon="inline-start" />
                  Use previous
                </Button>
              ) : null}
            </div>
            <DisclosureSelect
              ariaLabel="Destination"
              layout="grid"
              options={destinationOptions}
              value={destination || null}
              onChange={setDestination}
            />
            <ReferralDestinationFields
              destination={destination}
              value={{ officeId: referralOfficeId, departmentId: referralDepartmentId, email: referralEmail }}
              onChange={(patch) => {
                if ("officeId" in patch) setReferralOfficeId(patch.officeId ?? "")
                if ("departmentId" in patch) setReferralDepartmentId(patch.departmentId ?? "")
                if ("email" in patch) setReferralEmail(patch.email ?? "")
              }}
            />
            {destination === "Other" ? (
              <Input
                className="mt-2 h-11 sm:w-80"
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
            <DisclosureSelect
              ariaLabel="Expected timeline"
              layout="grid"
              options={timelineOptions}
              value={timeline || null}
              onChange={setTimeline}
            />
            {timeline === "On a specific date" ? (
              <div className="mt-2">
                <InputGroup className="h-11 sm:w-64">
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
                  className="h-11 w-24"
                  placeholder="No."
                  value={timelineNum}
                  onChange={(e) => setTimelineNum(e.target.value)}
                />
                <Select value={timelineUnit} onValueChange={(v) => setTimelineUnit(v ?? timelineUnit)}>
                  <SelectTrigger className="h-11 w-40">
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
      <div className="fixed inset-x-0 bottom-14 z-20 border-t border-border bg-card/95 backdrop-blur md:bottom-0 md:left-[var(--sidebar-width,0)]">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
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

          <div className="flex items-center gap-2 sm:ml-auto">
            <Button variant="ghost" size="sm" onClick={handleClear} className="hidden sm:inline-flex">
              <RotateCcw data-icon="inline-start" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={openPreview} disabled={!service}>
              <FileText data-icon="inline-start" />
              Preview
            </Button>
            <Button
              size="sm"
              className="h-11 min-w-32 flex-1 sm:h-9 sm:flex-none"
              disabled={!allComplete || issuing}
              onClick={doIssue}
            >
              {issuing ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
              {issuing ? "Issuing…" : isOnline ? "Issue Notice" : "Queue Notice"}
            </Button>
          </div>
        </div>
      </div>

      <NoticePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} data={previewData} />

      <SuccessDialog issued={issued} onNewNotice={startNextNotice} onPreview={() => setPreviewOpen(true)} />

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
