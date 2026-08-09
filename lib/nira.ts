// NIRA Client Services Outcome Notice System — mock domain model, data and helpers.
// Frontend only. No real backend, database or external services.

export type ServiceId =
  | "first-registration"
  | "renewal"
  | "replacement"
  | "collection"
  | "birth-certification"
  | "death-certification"
  | "correction"
  | "confirmation"
  | "certification"
  | "getfirst-id"
  | "outreach"
  | "other"

export interface ServiceDef {
  id: ServiceId
  name: string
  icon: string // lucide icon key, mapped in service-icon.tsx
  frequent?: boolean
}

// Ordered with most frequently used services first.
export const SERVICES: ServiceDef[] = [
  { id: "first-registration", name: "First Registration — NIN", icon: "id-card", frequent: true },
  { id: "renewal", name: "Renewal of National ID", icon: "refresh-cw", frequent: true },
  { id: "collection", name: "Collection of National ID", icon: "package-check", frequent: true },
  { id: "replacement", name: "Replacement — Lost or Damaged", icon: "shield-alert", frequent: true },
  { id: "correction", name: "Correction of Particulars", icon: "pencil-line" },
  { id: "birth-certification", name: "Birth Certification", icon: "baby" },
  { id: "death-certification", name: "Death Certification", icon: "cross" },
  { id: "confirmation", name: "Confirmation of Information", icon: "badge-check" },
  { id: "certification", name: "Certification of Document", icon: "file-check" },
  { id: "getfirst-id", name: "GetFirst ID", icon: "sparkles" },
  { id: "outreach", name: "Outreach Services", icon: "truck" },
  { id: "other", name: "Other", icon: "ellipsis" },
]

export function serviceIcon(id: ServiceId | string): string {
  return SERVICES.find((s) => s.id === id)?.icon ?? "ellipsis"
}

export function serviceName(id: ServiceId | string): string {
  return SERVICES.find((s) => s.id === id)?.name ?? String(id)
}

// General reasons applicable to most services.
export const GENERAL_REASONS: string[] = [
  "Required document not presented",
  "Mandatory supporting information missing",
  "Current eligibility requirements not satisfied",
  "Another NIRA service must be completed first",
  "System or network interruption",
  "Records could not be verified",
  "Biometric verification unsuccessful",
  "Application still under review",
  "Card not yet available at the office",
  "Record requires further investigation",
  "Client attended the wrong office",
  "Other",
]

// Card-collection reasons that trigger precise card-location capture. Kept as
// exported constants so the form and PDF can key their conditional logic off
// the exact strings rather than duplicating them.
export const CARD_AT_DISTRICT_REASON = "Card is available at another NIRA District Office"
export const CARD_AT_OUTREACH_REASON =
  "Card is available at another NIRA outreach/service station within this District"

// Service-specific priority reasons shown first for particular services.
const SERVICE_REASONS: Partial<Record<ServiceId, string[]>> = {
  collection: [
    "Card not yet available at the office",
    CARD_AT_DISTRICT_REASON,
    CARD_AT_OUTREACH_REASON,
    "Biometric verification unsuccessful",
    "Records could not be verified",
    "System or network interruption",
  ],
  "first-registration": [
    "Required document not presented",
    "Mandatory supporting information missing",
    "Biometric verification unsuccessful",
    "Current eligibility requirements not satisfied",
  ],
  renewal: [
    "Required document not presented",
    "Current eligibility requirements not satisfied",
    "Records could not be verified",
    "Application still under review",
  ],
  replacement: [
    "Required document not presented",
    "Mandatory supporting information missing",
    "Records could not be verified",
    "System or network interruption",
  ],
  correction: [
    "Mandatory supporting information missing",
    "Required document not presented",
    "Record requires further investigation",
    "Application still under review",
  ],
}

// Returns reasons ordered so the most relevant ones appear first, "Other" always last.
export function reasonsForService(id: ServiceId | null): string[] {
  if (!id) return GENERAL_REASONS
  const priority = SERVICE_REASONS[id] ?? []
  const rest = GENERAL_REASONS.filter((r) => r !== "Other" && !priority.includes(r))
  return [...priority, ...rest.filter((r) => !priority.includes(r)), "Other"]
}

// Suggested action text based on the selected service and first selected reason.
export function suggestAction(service: ServiceId | null, reasons: string[]): string {
  const reason = reasons.find((r) => r !== "Other") ?? reasons[0]
  if (!service || !reason) return ""

  const map: Record<string, string> = {
    "Required document not presented":
      "Return to this office with the original required document(s) so the requested service can be completed.",
    "Mandatory supporting information missing":
      "Return with the mandatory supporting information indicated by the serving officer.",
    "Current eligibility requirements not satisfied":
      "Satisfy the outstanding eligibility requirement(s) and return to this office to continue.",
    "Another NIRA service must be completed first":
      "Complete the prerequisite NIRA service first, then return to continue with this request.",
    "System or network interruption":
      "Return to this office once system services have been restored. No additional documents are required.",
    "Records could not be verified":
      "Await verification of your records by NIRA. You will be contacted when verification is complete.",
    "Biometric verification unsuccessful":
      "Return to this office to repeat biometric capture. Ensure hands are clean and dry.",
    "Application still under review":
      "Await communication from NIRA. Your application is still under review.",
    "Card not yet available at the office":
      "Await notification that your National ID card has arrived at this office before returning to collect it.",
    [CARD_AT_DISTRICT_REASON]:
      "Proceed to the indicated NIRA District Office for card collection and present this notice where applicable.",
    [CARD_AT_OUTREACH_REASON]:
      "Proceed to the indicated outreach/service station and ask for the named NIRA staff member for card collection.",
    "Record requires further investigation":
      "Await communication from NIRA while your record is investigated.",
    "Client attended the wrong office":
      "Attend the correct NIRA office indicated by the serving officer to complete this service.",
  }

  if (service === "collection" && reason === "Card not yet available at the office") {
    return "Await an SMS notification confirming your National ID card has arrived at this office, then return to collect it. Bring your collection slip."
  }

  return map[reason] ?? "Follow the guidance provided by the serving officer to complete this service."
}

export const DESTINATIONS = [
  "Return to this office",
  "Another NIRA District Office",
  "NIRA Headquarters",
  "Health facility",
  "Local Council",
  "Police",
  "Court",
  "Await communication from NIRA",
  "Other",
] as const

// Destinations that require capturing a precise receiving office / department.
export const REFERRAL_DISTRICT_DESTINATION = "Another NIRA District Office"
export const REFERRAL_HQ_DESTINATION = "NIRA Headquarters"

export const TIMELINES = [
  "Same day",
  "Within two working days",
  "Within five working days",
  "On a specific date",
  "Await communication",
  "No return required",
  "Other",
] as const

export const OFFICES = [
  "Makindye District Office",
  "Kampala Central Office",
  "Wakiso District Office",
  "Mukono District Office",
  "NIRA Headquarters",
] as const

export const OFFICERS = [
  "Paul Kasawuli — Senior Registration Officer",
  "Grace Nabbosa — Registration Officer",
  "John Okello — Registration Officer",
  "Amina Namusoke — Senior Registration Officer",
  "Peter Ochieng — Registration Assistant",
] as const

export const DELIVERY_METHODS = [
  { id: "sms", label: "SMS only" },
  { id: "sms-email", label: "SMS and email" },
  { id: "print", label: "Print copy" },
] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]["id"]

export type CaseStatus =
  | "Draft"
  | "Issued"
  | "Awaiting Client Action"
  | "Awaiting NIRA Action"
  | "Under Review"
  | "Resolved"
  | "Escalated"
  | "Revised"
  | "Cancelled"

export const CASE_STATUSES: CaseStatus[] = [
  "Draft",
  "Issued",
  "Awaiting Client Action",
  "Awaiting NIRA Action",
  "Under Review",
  "Resolved",
  "Escalated",
  "Revised",
  "Cancelled",
]

export type DeliveryStatus = "Pending" | "Queued" | "Sent" | "Delivered" | "Failed"

/**
 * QR-based referral tracking lifecycle. Distinct from `caseStatus` (the internal
 * NIRA workflow): this lifecycle follows the physical journey of the referral as
 * it is scanned/acknowledged at the receiving office.
 */
export type TrackingStatus =
  | "ISSUED"
  | "VIEWED"
  | "RECEIVED AT DESTINATION"
  | "ACTIONED"
  | "CLOSED"
  | "CANCELLED"

export const TRACKING_STATUSES: TrackingStatus[] = [
  "ISSUED",
  "VIEWED",
  "RECEIVED AT DESTINATION",
  "ACTIONED",
  "CLOSED",
  "CANCELLED",
]

/**
 * A referral (and its QR) stays valid until it is administratively closed or
 * cancelled — it must never expire on a timer, since clients may take time to
 * report to the receiving office.
 */
export function isNoticeValid(status: TrackingStatus | undefined): boolean {
  return status !== "CLOSED" && status !== "CANCELLED"
}

export interface NoticeRecord {
  id: string
  noticeNumber: string
  dateTime: string // ISO
  clientName: string
  phone: string
  email?: string
  nin?: string
  service: ServiceId
  reasons: string[]
  action: string
  destination: string
  // Precise referral capture (stable ids reference master data).
  referralDestinationType?: ReferralLocationType
  referralOfficeId?: string
  referralDepartmentId?: string
  referralEmail?: string
  referralEmailStatus?: ReferralEmailStatus
  referralEmailSentAt?: string // ISO
  // Card-collection referral capture. Snapshots (name/email/batch/location/staff)
  // are stored literally so later master-data edits never alter past notices.
  cardLocationType?: CardLocationType
  cardLocationOfficeId?: string
  cardLocationText?: string // snapshot: district office name OR outreach location
  cardBatchNumber?: string
  receivingOfficeEmail?: string // snapshot of the office email at issue time
  outreachContactStaffName?: string
  outreachContactStaffId?: string
  outreachContactStaffPhone?: string
  timeline: string
  additional?: string
  officer: string
  office: string
  deliveryMethod: DeliveryMethod
  smsStatus: DeliveryStatus
  emailStatus?: DeliveryStatus
  pdfStatus: "Generated" | "Pending" | "Failed"
  caseStatus: CaseStatus
  priority: "High" | "Medium" | "Low"
  expectedCompletion?: string // ISO date
  // Offline / sync metadata
  syncState?: "synced" | "queued"
  createdOffline?: boolean
  resolvedAt?: string // ISO — set when case marked Resolved
  // QR retrieval + referral tracking. The token is a long, random, non-sequential
  // string embedded in the QR URL (never the client's PII). The notice stays
  // retrievable via this token until closed/cancelled.
  retrievalToken?: string
  trackingStatus?: TrackingStatus
  viewedAt?: string // ISO — first time the public verification page was opened
  acknowledgedAt?: string // ISO — when a receiving officer acknowledged the referral
  acknowledgedByOffice?: string
  acknowledgedByOfficer?: string
}

// ---------------------------------------------------------------------------
// Formatting & masking helpers
// ---------------------------------------------------------------------------

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\s+/g, " ")
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 4) return phone
  const last3 = digits.slice(-3)
  return `+256 XXX XXX ${last3}`
}

export function maskNin(nin?: string): string {
  if (!nin) return "—"
  if (nin.length <= 4) return "•".repeat(nin.length)
  return `${"•".repeat(Math.max(0, nin.length - 4))}${nin.slice(-4)}`
}

export function isValidUgandaPhone(phone: string): boolean {
  const digits = phone.replace(/[\s-]/g, "")
  return /^(\+?256|0)7\d{8}$/.test(digits)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const OFFICE_CODE: Record<string, string> = {
  "Makindye District Office": "MAK",
  "Kampala Central Office": "KLA",
  "Wakiso District Office": "WAK",
  "Mukono District Office": "MUK",
  "NIRA Headquarters": "HQ",
}

export function generateNoticeNumber(office = "Makindye District Office"): string {
  const code = OFFICE_CODE[office] ?? "MAK"
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`
  const seq = String(Math.floor(400 + Math.random() * 500)).padStart(5, "0")
  return `CR-${code}-${stamp}-${seq}`
}

/**
 * Generate a secure, random, non-sequential retrieval token for a notice's QR
 * code. 32 base62 characters (~190 bits) so a notice cannot be discovered by
 * guessing notice numbers or incrementing a URL value.
 */
export function generateRetrievalToken(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const len = 32
  let out = ""
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = new Uint8Array(len)
    crypto.getRandomValues(bytes)
    for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length]
  } else {
    for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

/** Relative path to the public verification page for a retrieval token. */
export function noticeVerifyPath(token: string): string {
  return `/notice/${token}`
}

/**
 * Absolute verification URL encoded into the QR. Uses the current origin at
 * runtime so the same code works across preview/production domains.
 */
export function noticeVerifyUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `${origin}${noticeVerifyPath(token)}`
}

export const CURRENT_OFFICER = {
  name: "Paul Kasawuli",
  title: "Senior Registration Officer",
  office: "Makindye District Office",
  initials: "PK",
}

export const COMPLAINTS_CONTACTS = {
  toll: "0800 100 100",
  email: "info@nira.go.ug",
  web: "www.nira.go.ug",
}

// ---------------------------------------------------------------------------
// Roles, districts & accounts — exactly two roles, no intermediate tiers.
// ---------------------------------------------------------------------------

export type Role = "district-staff" | "systems-admin"

export const ROLE_LABEL: Record<Role, string> = {
  "district-staff": "District Staff",
  "systems-admin": "Systems Admin",
}

export interface District {
  id: string
  name: string // matches the office string used on NoticeRecord.office
  code: string
}

// Field districts (staff-assignable). Each maps 1:1 to an office string.
// Existing four kept verbatim so previously-assigned staff/notices stay mapped;
// the rest are the additional Central-region offices requested for assignment.
export const DISTRICTS: District[] = [
  { id: "makindye", name: "Makindye District Office", code: "MAK" },
  { id: "kampala-central", name: "Kampala Central Office", code: "KLA" },
  { id: "wakiso", name: "Wakiso District Office", code: "WAK" },
  { id: "mukono", name: "Mukono District Office", code: "MUK" },
  { id: "nakasongola", name: "Nakasongola District Office", code: "NSG" },
  { id: "nakaseke", name: "Nakaseke District Office", code: "NSK" },
  { id: "luweero", name: "Luweero District Office", code: "LUW" },
  { id: "kawempe", name: "Kawempe District Office", code: "KAW" },
  { id: "rubaga", name: "Rubaga District Office", code: "RUB" },
  { id: "kayunga", name: "Kayunga District Office", code: "KAY" },
  { id: "buvuma", name: "Buvuma District Office", code: "BUV" },
  { id: "buikwe", name: "Buikwe District Office", code: "BUI" },
  { id: "gomba", name: "Gomba District Office", code: "GOM" },
  { id: "mpigi", name: "Mpigi District Office", code: "MPI" },
  { id: "butambala", name: "Butambala District Office", code: "BUT" },
]

export function districtByName(name: string): District | undefined {
  return DISTRICTS.find((d) => d.name === name)
}

export interface UserAccount {
  id: string
  name: string
  title: string
  role: Role
  district: string // office/district name; "All Districts" for admin (national scope)
  initials: string
  active: boolean
  email?: string
}

export const ALL_DISTRICTS = "All Districts"

// Two demo accounts (one per role) used for quick sign-in.
export const DEMO_ACCOUNTS: Record<"staff" | "admin", UserAccount> = {
  staff: {
    id: "acc-staff",
    name: "Paul Kasawuli",
    title: "Senior Registration Officer",
    role: "district-staff",
    district: "Makindye District Office",
    initials: "PK",
    active: true,
    email: "p.kasawuli@nira.go.ug",
  },
  admin: {
    id: "acc-admin",
    name: "Miriam Achieng",
    title: "Systems Administrator",
    role: "systems-admin",
    district: ALL_DISTRICTS,
    initials: "MA",
    active: true,
    email: "m.achieng@nira.go.ug",
  },
}

// Seed roster of officer accounts managed in the Admin panel.
export const SEED_ACCOUNTS: UserAccount[] = [
  DEMO_ACCOUNTS.admin,
  DEMO_ACCOUNTS.staff,
  {
    id: "acc-2",
    name: "Grace Nabbosa",
    title: "Registration Officer",
    role: "district-staff",
    district: "Makindye District Office",
    initials: "GN",
    active: true,
    email: "g.nabbosa@nira.go.ug",
  },
  {
    id: "acc-3",
    name: "John Okello",
    title: "Registration Officer",
    role: "district-staff",
    district: "Kampala Central Office",
    initials: "JO",
    active: true,
    email: "j.okello@nira.go.ug",
  },
  {
    id: "acc-4",
    name: "Amina Namusoke",
    title: "Senior Registration Officer",
    role: "district-staff",
    district: "Wakiso District Office",
    initials: "AN",
    active: true,
    email: "a.namusoke@nira.go.ug",
  },
  {
    id: "acc-5",
    name: "Peter Ochieng",
    title: "Registration Assistant",
    role: "district-staff",
    district: "Mukono District Office",
    initials: "PO",
    active: false,
    email: "p.ochieng@nira.go.ug",
  },
]

// Delivery-channel availability, controlled by Systems Admin.
export interface DeliveryChannelSettings {
  sms: boolean
  email: boolean
  print: boolean
}

export const DEFAULT_CHANNEL_SETTINGS: DeliveryChannelSettings = {
  sms: true,
  email: true,
  print: true,
}

// ---------------------------------------------------------------------------
// Referral master data — centrally maintained so office names and department
// contacts can change without altering the form or historic referral records.
// ---------------------------------------------------------------------------

/** Domain used to compose official department addresses. */
export const NIRA_EMAIL_DOMAIN = "nira.go.ug"

export type ReferralLocationType = "DISTRICT_OFFICE" | "HEADQUARTERS" | "OTHER"

/** Where a National ID card is physically held for a collection referral. */
export type CardLocationType = "DISTRICT_OFFICE" | "LOCAL_OUTREACH"

export interface ReferralLocation {
  id: string
  type: ReferralLocationType
  name: string
  region: string
  active: boolean
  /** Official office email from master data. May be absent (needs admin config). */
  email?: string
}

/**
 * Master list of Uganda district offices a client can be referred to, grouped by
 * the six NIRA administrative regions. Built from a name+region seed so the full
 * national list stays maintainable; each entry gets a stable id (stored on the
 * referral so display names can change later without affecting past records) and
 * an official office email derived from the district name.
 */
const UGANDA_DISTRICT_SEED: ReadonlyArray<{ name: string; region: string }> = [
  // Central
  { name: "Kampala Central", region: "Central" },
  { name: "Kawempe", region: "Central" },
  { name: "Makindye", region: "Central" },
  { name: "Rubaga", region: "Central" },
  { name: "Nakawa", region: "Central" },
  { name: "Wakiso", region: "Central" },
  { name: "Mukono", region: "Central" },
  { name: "Luweero", region: "Central" },
  { name: "Buikwe", region: "Central" },
  { name: "Nakasongola", region: "Central" },
  { name: "Gomba", region: "Central" },
  { name: "Butambala", region: "Central" },
  { name: "Kayunga", region: "Central" },
  { name: "Mpigi", region: "Central" },
  { name: "Nakaseke", region: "Central" },
  { name: "Buvuma", region: "Central" },
  // Mid Western
  { name: "Kasese", region: "Mid Western" },
  { name: "Mubende", region: "Mid Western" },
  { name: "Kasanda", region: "Mid Western" },
  { name: "Hoima", region: "Mid Western" },
  { name: "Kikuube", region: "Mid Western" },
  { name: "Kibaale", region: "Mid Western" },
  { name: "Kabarole", region: "Mid Western" },
  { name: "Bunyangabu", region: "Mid Western" },
  { name: "Kyenjojo", region: "Mid Western" },
  { name: "Mityana", region: "Mid Western" },
  { name: "Kyegegwa", region: "Mid Western" },
  { name: "Kamwenge", region: "Mid Western" },
  { name: "Kitagwenda", region: "Mid Western" },
  { name: "Kiryandongo", region: "Mid Western" },
  { name: "Masindi", region: "Mid Western" },
  { name: "Kyankwanzi", region: "Mid Western" },
  { name: "Kagadi", region: "Mid Western" },
  { name: "Kiboga", region: "Mid Western" },
  { name: "Kakumiro", region: "Mid Western" },
  { name: "Buliisa", region: "Mid Western" },
  { name: "Ntoroko", region: "Mid Western" },
  { name: "Ibanda", region: "Mid Western" },
  { name: "Bundibugyo", region: "Mid Western" },
  // Eastern
  { name: "Iganga", region: "Eastern" },
  { name: "Jinja", region: "Eastern" },
  { name: "Mbale", region: "Eastern" },
  { name: "Tororo", region: "Eastern" },
  { name: "Mayuge", region: "Eastern" },
  { name: "Kamuli", region: "Eastern" },
  { name: "Bugiri", region: "Eastern" },
  { name: "Pallisa", region: "Eastern" },
  { name: "Busia", region: "Eastern" },
  { name: "Manafwa", region: "Eastern" },
  { name: "Sironko", region: "Eastern" },
  { name: "Buyende", region: "Eastern" },
  { name: "Namayingo", region: "Eastern" },
  { name: "Kaliro", region: "Eastern" },
  { name: "Luuka", region: "Eastern" },
  { name: "Budaka", region: "Eastern" },
  { name: "Kibuku", region: "Eastern" },
  { name: "Butaleja", region: "Eastern" },
  { name: "Namutumba", region: "Eastern" },
  { name: "Namisindwa", region: "Eastern" },
  { name: "Butebo", region: "Eastern" },
  { name: "Bugweri", region: "Eastern" },
  { name: "Bulambuli", region: "Eastern" },
  { name: "Bududa", region: "Eastern" },
  { name: "Kapchorwa", region: "Eastern" },
  { name: "Bukwo", region: "Eastern" },
  { name: "Kween", region: "Eastern" },
  // Western
  { name: "Mbarara", region: "Western" },
  { name: "Ntungamo", region: "Western" },
  { name: "Kabale", region: "Western" },
  { name: "Rakai", region: "Western" },
  { name: "Kyotera", region: "Western" },
  { name: "Isingiro", region: "Western" },
  { name: "Masaka", region: "Western" },
  { name: "Kisoro", region: "Western" },
  { name: "Lwengo", region: "Western" },
  { name: "Rukungiri", region: "Western" },
  { name: "Kiruhura", region: "Western" },
  { name: "Kazo", region: "Western" },
  { name: "Kanungu", region: "Western" },
  { name: "Ssembabule", region: "Western" },
  { name: "Bushenyi", region: "Western" },
  { name: "Mitooma", region: "Western" },
  { name: "Sheema", region: "Western" },
  { name: "Kalungu", region: "Western" },
  { name: "Rubanda", region: "Western" },
  { name: "Rukiga", region: "Western" },
  { name: "Bukomansimbi", region: "Western" },
  { name: "Rubirizi", region: "Western" },
  { name: "Buhweju", region: "Western" },
  { name: "Lyantonde", region: "Western" },
  { name: "Rwampara", region: "Western" },
  { name: "Kalangala", region: "Western" },
  // North Eastern
  { name: "Abim", region: "North Eastern" },
  { name: "Serere", region: "North Eastern" },
  { name: "Soroti", region: "North Eastern" },
  { name: "Kumi", region: "North Eastern" },
  { name: "Amuria", region: "North Eastern" },
  { name: "Alebtong", region: "North Eastern" },
  { name: "Kaberamaido", region: "North Eastern" },
  { name: "Bukedea", region: "North Eastern" },
  { name: "Katakwi", region: "North Eastern" },
  { name: "Dokolo", region: "North Eastern" },
  { name: "Agago", region: "North Eastern" },
  { name: "Ngora", region: "North Eastern" },
  { name: "Amolatar", region: "North Eastern" },
  { name: "Kalaki", region: "North Eastern" },
  { name: "Kotido", region: "North Eastern" },
  { name: "Kaabong", region: "North Eastern" },
  { name: "Nakapiripirit", region: "North Eastern" },
  { name: "Otuke", region: "North Eastern" },
  { name: "Karenga", region: "North Eastern" },
  { name: "Napak", region: "North Eastern" },
  { name: "Kapelebyong", region: "North Eastern" },
  { name: "Moroto", region: "North Eastern" },
  { name: "Amudat", region: "North Eastern" },
  { name: "Nabilatuk", region: "North Eastern" },
  // North Western
  { name: "Apac", region: "North Western" },
  { name: "Kwania", region: "North Western" },
  { name: "Oyam", region: "North Western" },
  { name: "Arua", region: "North Western" },
  { name: "Madi-Okollo", region: "North Western" },
  { name: "Terego", region: "North Western" },
  { name: "Nebbi", region: "North Western" },
  { name: "Pakwach", region: "North Western" },
  { name: "Lira", region: "North Western" },
  { name: "Gulu", region: "North Western" },
  { name: "Yumbe", region: "North Western" },
  { name: "Zombo", region: "North Western" },
  { name: "Koboko", region: "North Western" },
  { name: "Maracha", region: "North Western" },
  { name: "Kitgum", region: "North Western" },
  { name: "Adjumani", region: "North Western" },
  { name: "Pader", region: "North Western" },
  { name: "Amuru", region: "North Western" },
  { name: "Lamwo", region: "North Western" },
  { name: "Moyo", region: "North Western" },
  { name: "Obongi", region: "North Western" },
  { name: "Nwoya", region: "North Western" },
  { name: "Omoro", region: "North Western" },
  { name: "Kole", region: "North Western" },
]

const officeSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const officeEmail = (name: string) =>
  `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")}@${NIRA_EMAIL_DOMAIN}`

export const REFERRAL_LOCATIONS: ReferralLocation[] = UGANDA_DISTRICT_SEED.map((d) => ({
  id: `loc-${officeSlug(d.name)}`,
  type: "DISTRICT_OFFICE",
  name: d.name,
  region: d.region,
  active: true,
  email: officeEmail(d.name),
}))

export function referralLocationById(id: string | undefined): ReferralLocation | undefined {
  if (!id) return undefined
  return REFERRAL_LOCATIONS.find((l) => l.id === id)
}

export interface HeadquartersDepartment {
  id: string
  name: string
  email: string
  active: boolean
}

/**
 * Configurable Headquarters departments/sections. Additional departments can
 * be appended here without changing any front-end code.
 */
export const HQ_DEPARTMENTS: HeadquartersDepartment[] = [
  { id: "dept-legal", name: "Legal Department", email: `legal@${NIRA_EMAIL_DOMAIN}`, active: true },
  { id: "dept-client-relations", name: "Client Relations Office", email: `clientrelations@${NIRA_EMAIL_DOMAIN}`, active: true },
  { id: "dept-bdar", name: "BDAR Office", email: `bdar@${NIRA_EMAIL_DOMAIN}`, active: true },
]

export function hqDepartmentById(id: string | undefined): HeadquartersDepartment | undefined {
  if (!id) return undefined
  return HQ_DEPARTMENTS.find((d) => d.id === id)
}

export type ReferralEmailStatus = "not-required" | "pending" | "sent" | "failed"

/**
 * Produces the exact, precise referral destination label for a notice — never
 * the vague category on its own when a specific office/department is captured.
 */
export function referralDestinationLabel(n: {
  destination: string
  referralOfficeId?: string
  referralDepartmentId?: string
}): string {
  if (n.destination === REFERRAL_DISTRICT_DESTINATION) {
    const loc = referralLocationById(n.referralOfficeId)
    return loc ? `NIRA – ${loc.name} District Office` : n.destination
  }
  if (n.destination === REFERRAL_HQ_DESTINATION) {
    const dept = hqDepartmentById(n.referralDepartmentId)
    return dept ? `NIRA Headquarters – ${dept.name}` : n.destination
  }
  return n.destination
}
