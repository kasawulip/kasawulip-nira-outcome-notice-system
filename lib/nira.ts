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

// Service-specific priority reasons shown first for particular services.
const SERVICE_REASONS: Partial<Record<ServiceId, string[]>> = {
  collection: [
    "Card not yet available at the office",
    "Card dispatched to another office",
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
    "Card dispatched to another office":
      "Collect your National ID card from the office to which it was dispatched.",
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
  "Another NIRA office",
  "NIRA Headquarters",
  "Health facility",
  "Local Council",
  "Police",
  "Court",
  "Await communication from NIRA",
  "Other",
] as const

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
