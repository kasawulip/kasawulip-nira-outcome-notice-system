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
  return `NIRA-${code}-${stamp}-${seq}`
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
export const DISTRICTS: District[] = [
  { id: "makindye", name: "Makindye District Office", code: "MAK" },
  { id: "kampala-central", name: "Kampala Central Office", code: "KLA" },
  { id: "wakiso", name: "Wakiso District Office", code: "WAK" },
  { id: "mukono", name: "Mukono District Office", code: "MUK" },
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
 * Approved list of NIRA District/Division offices in Uganda, including the
 * Kampala Capital City divisions. Each has a stable id stored on the referral
 * so display names can be updated later without affecting past records. The
 * `email` is the centrally maintained official office address; a few offices
 * intentionally have none to exercise the "no official email configured" path.
 */
export const REFERRAL_LOCATIONS: ReferralLocation[] = [
  // Kampala Capital City divisions
  { id: "loc-kla-central", type: "DISTRICT_OFFICE", name: "Central Division", region: "Kampala", active: true, email: `central.division@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-kla-kawempe", type: "DISTRICT_OFFICE", name: "Kawempe Division", region: "Kampala", active: true, email: `kawempe.division@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-kla-makindye", type: "DISTRICT_OFFICE", name: "Makindye Division", region: "Kampala", active: true, email: `makindye.division@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-kla-nakawa", type: "DISTRICT_OFFICE", name: "Nakawa Division", region: "Kampala", active: true, email: `nakawa.division@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-kla-rubaga", type: "DISTRICT_OFFICE", name: "Rubaga Division", region: "Kampala", active: true, email: `rubaga.division@${NIRA_EMAIL_DOMAIN}` },
  // Central region districts
  { id: "loc-wakiso", type: "DISTRICT_OFFICE", name: "Wakiso", region: "Central", active: true, email: `wakiso@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-mukono", type: "DISTRICT_OFFICE", name: "Mukono", region: "Central", active: true, email: `mukono@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-mpigi", type: "DISTRICT_OFFICE", name: "Mpigi", region: "Central", active: true, email: `mpigi@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-luwero", type: "DISTRICT_OFFICE", name: "Luwero", region: "Central", active: true, email: `luwero@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-masaka", type: "DISTRICT_OFFICE", name: "Masaka", region: "Central", active: true, email: `masaka@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-mubende", type: "DISTRICT_OFFICE", name: "Mubende", region: "Central", active: true, email: `mubende@${NIRA_EMAIL_DOMAIN}` },
  // Eastern region
  { id: "loc-jinja", type: "DISTRICT_OFFICE", name: "Jinja City", region: "Eastern", active: true, email: `jinja@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-mbale", type: "DISTRICT_OFFICE", name: "Mbale City", region: "Eastern", active: true, email: `mbale@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-soroti", type: "DISTRICT_OFFICE", name: "Soroti City", region: "Eastern", active: true, email: `soroti@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-tororo", type: "DISTRICT_OFFICE", name: "Tororo", region: "Eastern", active: true, email: `tororo@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-iganga", type: "DISTRICT_OFFICE", name: "Iganga", region: "Eastern", active: true, email: `iganga@${NIRA_EMAIL_DOMAIN}` },
  // Northern region
  { id: "loc-gulu", type: "DISTRICT_OFFICE", name: "Gulu City", region: "Northern", active: true, email: `gulu@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-lira", type: "DISTRICT_OFFICE", name: "Lira City", region: "Northern", active: true, email: `lira@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-arua", type: "DISTRICT_OFFICE", name: "Arua City", region: "Northern", active: true, email: `arua@${NIRA_EMAIL_DOMAIN}` },
  // Master data gap on purpose: no official email configured yet.
  { id: "loc-kitgum", type: "DISTRICT_OFFICE", name: "Kitgum", region: "Northern", active: true },
  { id: "loc-moroto", type: "DISTRICT_OFFICE", name: "Moroto", region: "Northern", active: true },
  // Western region
  { id: "loc-mbarara", type: "DISTRICT_OFFICE", name: "Mbarara City", region: "Western", active: true, email: `mbarara@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-fortportal", type: "DISTRICT_OFFICE", name: "Fort Portal City", region: "Western", active: true, email: `fortportal@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-hoima", type: "DISTRICT_OFFICE", name: "Hoima City", region: "Western", active: true, email: `hoima@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-kabale", type: "DISTRICT_OFFICE", name: "Kabale", region: "Western", active: true, email: `kabale@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-kasese", type: "DISTRICT_OFFICE", name: "Kasese", region: "Western", active: true, email: `kasese@${NIRA_EMAIL_DOMAIN}` },
  { id: "loc-bushenyi", type: "DISTRICT_OFFICE", name: "Bushenyi", region: "Western", active: true, email: `bushenyi@${NIRA_EMAIL_DOMAIN}` },
]

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
