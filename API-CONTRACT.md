# NIRA Client Services Outcome Notice System — API Contract

Authoritative backend contract for the existing Next.js frontend. Field names,
enums, and master data below are taken **verbatim** from the frontend data layer
(`lib/nira.ts`, `components/data-store-context.tsx`). Build the API so responses
match these shapes exactly — the frontend consumes them with no field renaming.

- **Format:** REST, JSON in/out, resource-oriented routes.
- **Base URL:** exposed to the frontend as `NEXT_PUBLIC_API_BASE_URL`.
- **Timestamps:** ISO 8601 strings (the frontend calls `new Date(iso)`).
- **IDs, notice numbers, and timestamps** are generated **server-side**. Never trust client-supplied values for these.
- **Deliverables:** running API, OpenAPI/Swagger spec, Postman collection, seed script, and the list of required environment variables.

> **Changelog — 2026-08-09 (case-management-system).** Three contract-affecting changes since the last revision:
> 1. **District office emails are now free text** entered by the officer per referral — no longer stored in Office master data. The old "reject office without `officialEmail`" integrity rule is **reversed**. Affects §2 (Notice `referralEmail`/`receivingOfficeEmail`, Office), §5 issue flow, §6 validation, §7 seed.
> 2. **User account credential lifecycle:** new field `User.mustChangePassword`, default password `Welcome123`, forced first-login change, and admin password reset. New endpoints `POST /auth/change-password` and `POST /users/:id/reset-password`. Affects §1, §2, §4, §5a.
> 3. **Office regions expanded 5 → 6** (`Central | Mid Western | Eastern | Western | North Eastern | North Western`) and the office seed grew to 140 referral-target districts (no `code`, no email) plus a 16-office assignable/issuing set (with `code`). Affects §2, §3, §7.

---

## 1. Auth & roles

Exactly two roles. No intermediate tiers.

```
Role = "district-staff" | "systems-admin"
```

- `POST /auth/login` — body `{ email, password }` → `{ token, user }`. The returned `user` includes `mustChangePassword`; the frontend gates the whole app on it (see below).
- `POST /auth/logout`
- `GET /auth/me` → `{ user }` (the authenticated `User`, including `mustChangePassword`).
- `POST /auth/change-password` — **self**, authenticated. Body `{ currentPassword, newPassword }` (during a forced first-login change the frontend still knows the current/default password, so keep `currentPassword` required). On success set `mustChangePassword = false`. Returns the updated `{ user }`.

**Password lifecycle (see §5a):** new accounts are created server-side with the shared default password **`Welcome123`** and `mustChangePassword = true`. A user cannot use the app until they change it. An admin reset (`POST /users/:id/reset-password`) restores the default and re-arms `mustChangePassword = true`.

**Scoping (enforce on every endpoint, server-side):**
- `district-staff` may only read/write notices where `notice.office === user.district`.
- `systems-admin` has national scope (their `district` is the sentinel `"All Districts"`).
- Never accept a client-supplied office/scope; derive it from the authenticated user.
- Admin-only: user management, master-data CRUD, channel settings.

---

## 2. Entities

### User  (frontend type: `UserAccount`)

```ts
{
  id: string
  name: string
  title: string
  role: "district-staff" | "systems-admin"
  district: string        // office name, or "All Districts" for admin (national scope)
  initials: string
  active: boolean
  email?: string
  mustChangePassword: boolean  // true after create/admin-reset; forces a change at next login
  // backend-only, never returned: passwordHash
}
```

### Notice  (frontend type: `NoticeRecord`) — core record

```ts
{
  id: string
  noticeNumber: string          // server-generated, format below
  dateTime: string              // ISO — issue time
  clientName: string
  phone: string
  email?: string
  nin?: string                  // National ID / application number
  service: ServiceId            // enum §3
  reasons: string[]             // one or more from the reason catalog §3
  action: string                // "next step" text
  destination: string           // from DESTINATIONS §3
  timeline: string              // from TIMELINES §3
  additional?: string

  // --- Destination referral (when destination is a NIRA office/HQ) ---
  referralDestinationType?: "DISTRICT_OFFICE" | "HEADQUARTERS" | "OTHER"
  referralOfficeId?: string     // -> Office.id (master data)
  referralDepartmentId?: string // -> HqDepartment.id (master data)
  referralEmail?: string        // receiving email — officer-typed free text (client-supplied) for BOTH district-office and HQ-section referrals. Never derived from master data. Required whenever a referral is made.
  referralEmailStatus?: "not-required" | "pending" | "sent" | "failed"
  referralEmailSentAt?: string  // ISO

  // --- Card-collection referral (service = "collection" only) ---
  // Snapshots are stored LITERALLY so later master-data edits never alter history.
  cardLocationType?: "DISTRICT_OFFICE" | "LOCAL_OUTREACH"
  cardLocationOfficeId?: string // -> Office.id (district path)
  cardLocationText?: string     // snapshot: district office name OR outreach location text
  cardBatchNumber?: string
  receivingOfficeEmail?: string // district card path: officer-typed free-text office email (client-supplied, validated format-only)
  outreachContactStaffName?: string
  outreachContactStaffId?: string   // -> User.id if selected from roster
  outreachContactStaffPhone?: string

  // --- Delivery & lifecycle ---
  officer: string               // issuing officer display name
  office: string                // issuing office (scope key)
  deliveryMethod: "sms" | "sms-email" | "print"
  smsStatus: DeliveryStatus     // enum §3
  emailStatus?: DeliveryStatus
  pdfStatus: "Generated" | "Pending" | "Failed"
  caseStatus: CaseStatus        // enum §3
  priority: "High" | "Medium" | "Low"
  expectedCompletion?: string   // ISO date
  resolvedAt?: string           // ISO — set when caseStatus becomes "Resolved"

  // --- Offline / sync metadata ---
  syncState?: "synced" | "queued"
  createdOffline?: boolean

  // --- QR retrieval & referral tracking (§10) ---
  // The token is a long, random, NON-SEQUENTIAL string embedded in the QR URL —
  // never the client's PII, never the notice number. Generated server-side at issue.
  retrievalToken?: string       // e.g. 32-char base62 (~190 bits)
  trackingStatus?: TrackingStatus  // enum §3 — physical journey of the referral
  viewedAt?: string             // ISO — first time the public verify page was opened
  acknowledgedAt?: string       // ISO — when a receiving officer acknowledged
  acknowledgedByOffice?: string // snapshot of the acknowledging officer's office
  acknowledgedByOfficer?: string
}
```

### Office / District  (master data)

```ts
{
  id: string          // referral offices: "loc-<slug>" (no code). Issuing/assignable offices carry a code.
  name: string
  code?: string       // office code used in notice numbers, e.g. "WAK". Present only on the assignable/issuing set; the 140 referral-target offices have NO code.
  region: string      // 6-region vocab §3: "Central" | "Mid Western" | "Eastern" | "Western" | "North Eastern" | "North Western"
  type: "DISTRICT_OFFICE" | "HEADQUARTERS"
  officialEmail?: string   // DEPRECATED for districts — no longer stored/seeded on district offices (see rule below). Retained only for HQ if desired.
  active: boolean
}
```

> **Integrity rule (UPDATED — reverses the previous rule):** District office emails are
> **NOT** stored in master data. At referral time the officer **types the receiving
> office email as free text** (a faint `example@nira.go.ug` placeholder guides them),
> and the API persists that client-supplied value verbatim as `referralEmail` /
> `receivingOfficeEmail`. The API must **not** reject a district office for lacking an
> `officialEmail`, and must **not** derive the address from master data. Validate the
> officer-supplied email for **format only** (§6). HQ department referrals still use the
> department's stored `email`.

### HqDepartment  (master data — frontend type: `HeadquartersDepartment`)

```ts
{ id: string; name: string; email: string; active: boolean }
```

### Service  (master data — frontend type: `ServiceDef`)

```ts
{ id: ServiceId; name: string; icon: string; frequent?: boolean }
```

### ChannelSettings  (frontend type: `DeliveryChannelSettings`)

```ts
{ sms: boolean; email: boolean; print: boolean }
```

### AuditEvent  (append-only)

```ts
{ id: string; noticeId: string; actorId: string; action: string;
  fromValue?: string; toValue?: string; timestamp: string /* ISO */ }
```

Log at minimum: issue, delivery attempts, referral-email send/resend, case-status
changes, and any access to a full (unmasked) NIN.

### DeliveryLog  (per-notice delivery attempts)

```ts
{ id: string; noticeId: string; channel: "sms" | "email"; status: DeliveryStatus;
  timestamp: string /* ISO */; error?: string }
```

---

## 3. Enums & fixed vocabularies (use these exact string values)

```ts
ServiceId =
  "first-registration" | "renewal" | "replacement" | "collection" |
  "birth-certification" | "death-certification" | "correction" |
  "confirmation" | "certification" | "getfirst-id" | "outreach" | "other"

DeliveryMethod  = "sms" | "sms-email" | "print"
DeliveryStatus  = "Pending" | "Queued" | "Sent" | "Delivered" | "Failed"
PdfStatus       = "Generated" | "Pending" | "Failed"
Priority        = "High" | "Medium" | "Low"

CaseStatus =
  "Draft" | "Issued" | "Awaiting Client Action" | "Awaiting NIRA Action" |
  "Under Review" | "Resolved" | "Escalated" | "Revised" | "Cancelled"

ReferralLocationType = "DISTRICT_OFFICE" | "HEADQUARTERS" | "OTHER"
CardLocationType     = "DISTRICT_OFFICE" | "LOCAL_OUTREACH"
ReferralEmailStatus  = "not-required" | "pending" | "sent" | "failed"

// Office regions — 6-value NIRA operating-region vocabulary (was 5; "Kampala" folded
// into "Central", "Northern" split into "North Eastern" / "North Western",
// "Western" split into "Western" / "Mid Western").
Region = "Central" | "Mid Western" | "Eastern" | "Western" | "North Eastern" | "North Western"

// QR referral tracking lifecycle (distinct from CaseStatus — see §10).
// A referral NEVER expires on a timer; it stays valid until CLOSED or CANCELLED.
TrackingStatus =
  "ISSUED" | "VIEWED" | "RECEIVED AT DESTINATION" | "ACTIONED" | "CLOSED" | "CANCELLED"

DESTINATIONS = [
  "Return to this office", "Another NIRA District Office", "NIRA Headquarters",
  "Health facility", "Local Council", "Police", "Court",
  "Await communication from NIRA", "Other"
]
// Destinations that require capturing a precise receiving office/department:
REFERRAL_DISTRICT_DESTINATION = "Another NIRA District Office"
REFERRAL_HQ_DESTINATION       = "NIRA Headquarters"

TIMELINES = [
  "Same day", "Within two working days", "Within five working days",
  "On a specific date", "Await communication", "No return required", "Other"
]
```

### Reason catalog

General reasons (apply to most services):

```
"Required document not presented"
"Mandatory supporting information missing"
"Current eligibility requirements not satisfied"
"Another NIRA service must be completed first"
"System or network interruption"
"Records could not be verified"
"Biometric verification unsuccessful"
"Application still under review"
"Card not yet available at the office"
"Record requires further investigation"
"Client attended the wrong office"
"Other"
```

Card-collection reasons (service `"collection"`) that trigger precise card-location capture:

```
CARD_AT_DISTRICT_REASON = "Card is available at another NIRA District Office"
CARD_AT_OUTREACH_REASON = "Card is available at another NIRA outreach/service station within this District"
```

---

## 4. Endpoints

### Notices

- `GET /notices` — list, **auto-scoped by role**. Query params: `office`, `caseStatus`, `service`, `dateFrom`, `dateTo`, `q` (search name/notice-number/phone), `page`, `pageSize`. Returns `{ items: Notice[], page, pageSize, total }`.
- `GET /notices/:id`
- `POST /notices` — **issue a notice** (see §5 for the full server flow).
- `PATCH /notices/:id/case-status` — body `{ caseStatus }`; validate allowed transition; set `resolvedAt` when moving to `"Resolved"`; write audit event.
- `POST /notices/:id/retry-delivery` — re-attempt SMS/email; update `smsStatus`/`emailStatus`; write `DeliveryLog` + audit.
- `POST /notices/:id/resend-referral-email` — **authorized resend**; re-send referral email, update `referralEmailStatus` + `referralEmailSentAt`; write audit. Returns `{ success: boolean, referralEmailStatus }`.
- `GET /notices/:id/pdf` — returns the generated outcome-notice PDF (`application/pdf`). See §5 for required PDF content.
- `POST /sync/outbox` — accept a batch of notices created offline: body `{ notices: Notice[] }`. **Idempotent by client-supplied `id`** (do not duplicate). Returns `{ accepted: string[], queued: string[], rejected: {id,reason}[] }`, and each accepted notice comes back with `syncState: "synced"`.

### QR verification (public + receiving-officer)

The QR embedded in every notice/PDF encodes the absolute URL `<APP_ORIGIN>/notice/:token`.
These endpoints back that page (see §10 for the full model).

- `GET /notice/verify/:token` — **public, no auth**. Look up the notice by `retrievalToken`. Returns a **masked** public summary only:
  `{ noticeNumber, dateTime, service, serviceName, destination, office, trackingStatus, valid: boolean, acknowledgedAt?, acknowledgedByOffice?, acknowledgedByOfficer? }`.
  Side effect: if `trackingStatus === "ISSUED"`, advance it to `"VIEWED"` and set `viewedAt` (idempotent — never regress a further-along referral). `valid` is `false` when status is `CLOSED`/`CANCELLED`. Returns `404` for an unknown token; do **not** leak whether a token "used to exist."
- `GET /notice/verify/:token/full` — returns the full notice for rendering the immutable notice/PDF view. Public read of the referral document; still masks `nin`/`phone` in the summary fields per §5. (Or require a lightweight receiving-officer session if you prefer stricter privacy — the frontend supports both a public summary and an authenticated full view.)
- `GET /notice/verify/:token/pdf` — the generated PDF for this token (`application/pdf`); same content as `GET /notices/:id/pdf`.
- `POST /notice/verify/:token/acknowledge` — **authenticated receiving officer**. Body `{ office, officer }` (or derive from the session). Advances `trackingStatus` to `"RECEIVED AT DESTINATION"`, sets `acknowledgedAt`, `acknowledgedByOffice`, `acknowledgedByOfficer`; writes an audit event. Rejected when the referral is not `valid` (already `CLOSED`/`CANCELLED`). Returns the updated public summary.

### Master data

- `GET /offices`, `GET /offices/:id`
- `GET /hq-departments`
- `GET /services`
- Admin CRUD: `POST/PATCH /offices`, `POST/PATCH /hq-departments`.

### Users (admin)

- `GET /users` (scoped: admin sees all).
- `POST /users` — create account. Server sets the default password `Welcome123` and `mustChangePassword = true` (the client never sends a password on create). Returns the created `User`.
- `PATCH /users/:id`, `PATCH /users/:id/active` (toggle `active`).
- `POST /users/:id/reset-password` — **admin only**. Resets the target's password to the default `Welcome123` and sets `mustChangePassword = true`; writes an audit event. Returns the updated `User`. Does **not** return the password.

### Settings (admin)

- `GET /channel-settings`, `PATCH /channel-settings` — body is a partial of `{ sms, email, print }`.

> These map 1:1 to the current frontend store/session methods: `issueNotice`, `resolveCase`,
> `updateCaseStatus`, `retryDelivery`, `sendReferralEmail`, `syncOutbox`, `addAccount`,
> `updateAccount`, `toggleAccountActive`, `updateChannelSettings`, the auth methods
> `authenticate`/`signIn`, `changePassword` (forced + voluntary) and admin reset (`updateAccount`
> with `password`+`mustChangePassword`), and the QR methods
> `findByToken`, `recordView`, `acknowledgeReferral`, `updateTrackingStatus` (→ §10).

---

## 5. Business rules

### 5a. Account credentials & first-login change
- **Create:** `POST /users` seeds the shared default password **`Welcome123`** and `mustChangePassword = true`. The client never supplies a password on create.
- **First login:** `POST /auth/login` succeeds with the default password and returns `mustChangePassword = true`. The frontend then blocks all app routes and shows a forced change screen until `POST /auth/change-password` succeeds and flips the flag to `false`.
- **Admin reset:** `POST /users/:id/reset-password` restores `Welcome123` and re-arms `mustChangePassword = true`, so the user is forced to change again at next login.
- Passwords are hashed server-side (never returned in any response). The frontend prototype stores them in plaintext in `localStorage`; the API must **not** mirror that.

### Notice numbers
- Server-generated, sequential **per office per year**, never reused.
- Format follows the current frontend convention: `CR-<OFFICE_CODE>-<YYYYMMDD>-<SEQ>` (e.g. `CR-WAK-20260808-00417`). Office codes: `MAK, KLA, WAK, MUK, HQ, ...` from Office master data. (The `CR` prefix = "Central Region", the pilot/study system name. Any pre-existing records carrying the legacy `NIRA-` prefix keep their original numbers — numbers are immutable once issued; only newly generated numbers use `CR-`.)

### Issue flow (`POST /notices`) — order matters
1. Validate payload (§6). For district referrals, validate the officer-supplied email **format only** — do **not** reject based on master data (district offices have no stored email).
2. **Save the notice first** and generate `noticeNumber`, a secure random `retrievalToken`, and set `trackingStatus = "ISSUED"`.
3. Persist referral fields onto the record:
   - District card path → `cardLocationText = "NIRA <name> District Office"`, `receivingOfficeEmail = <officer-typed free-text email>` (client-supplied), `cardBatchNumber`.
   - District office referral (destination = "Another NIRA District Office") → `referralEmail = <officer-typed free-text email>` (client-supplied).
   - Outreach card path → `cardLocationText = <free-text location>`, `outreachContactStaffName` (+ optional phone), `cardBatchNumber`.
   - HQ department referral (destination = "NIRA Headquarters") → `referralEmail = <officer-typed free-text email>` (client-supplied). The department selection identifies the receiving section; the address itself is **typed per referral, never derived from master data**.
4. Generate the PDF (`pdfStatus`). This PDF is the exact, immutable outcome-notice document issued to the client (identical to `GET /notices/:id/pdf`).
5. Set initial delivery statuses per `deliveryMethod` and enabled channels.
6. **Mandatory referral auto-send:** for **every** referral (HQ section OR another NIRA district office), immediately after the notice is generated, automatically email the exact-copy PDF (step 4) to the officer-typed `referralEmail`. Record `referralEmailStatus` (`pending` → `sent`/`failed`) and `referralEmailSentAt`. This is not optional and not user-triggered — it fires on successful generation.
7. **A failed email must never lose the notice** — keep the record and mark `pending`/`failed` with an authorized resend available (`POST /notices/:id/resend-referral-email`).

### Referral email content (must include)
Notice Number · Client Full Name · NIN/Application Number · Client Phone · Referring Office · Referring Officer · Card Batch Number (if applicable) · Receiving Office/Department · Service Requested · Reason · referral date & time · **the generated outcome-notice PDF attached, byte-for-byte identical to the client's issued notice**.

Subject line for card-collection referrals:
```
Central Region Card Collection Referral – [NOTICE NUMBER] – [CLIENT NAME] – Batch [BATCH NUMBER]
```

### Card-collection PDF (service `"collection"`)
Must state the **exact** card location, batch number, and either the receiving
office email (district path) or the contact staff member (outreach path), plus the
next-step action. Never render a vague "go to another NIRA office."

### QR on every notice/PDF
Every generated notice and PDF embeds a scannable QR encoding `<APP_ORIGIN>/notice/:token`,
alongside a human-readable fallback (Notice Number + destination) so the referral can
be verified from a printout, screenshot, or phone screen even with no email/SMS/internet
for the client. The PDF is **immutable** once issued. See §10.

### PII
- Store `nin` and `phone` in full. Provide masked forms in list/summary responses
  matching the frontend helpers: phone → `+256 XXX XXX <last3>`; NIN → all but last 4 masked.
- Log any access to the full NIN in the audit trail.

### Delivery
- Use a real transactional email provider (SMTP/SendGrid, env-configurable) for referral emails.
- If no SMS gateway is configured, simulate SMS status transitions (`Pending → Queued → Sent → Delivered`, with occasional `Failed`).

---

## 6. Validation
- Uganda phone: matches `^(\+?256|0)7\d{8}$`.
- Email: standard address format.
- Required per service/reason pathway:
  - District card path → `cardLocationOfficeId` + `cardBatchNumber` + `receivingOfficeEmail` (officer-typed, valid email **format**; no master-data email lookup).
  - District office referral → `referralOfficeId` + `referralEmail` (officer-typed, valid email format).
  - HQ section referral → `referralDepartmentId` + `referralEmail` (officer-typed, valid email format; not derived from the department).
  - Outreach card path → `cardLocationText` + `cardBatchNumber` + `outreachContactStaffName`.
- The two card-collection reasons are **mutually exclusive**; reject a payload containing both.

---

## 7. Seed data
- **Users:** one `district-staff` in "Makindye District Office" (Paul Kasawuli, `p.kasawuli@nira.go.ug`) and one `systems-admin` with national scope (Miriam Achieng, `m.achieng@nira.go.ug`); plus the roster in `SEED_ACCOUNTS` (Grace Nabbosa, John Okello, Amina Namusoke, Peter Ochieng — the last `active: false`). Seed every account with password `Welcome123`; seed accounts may set `mustChangePassword = false` (pre-onboarded) while **newly created** accounts always get `true`.
- **Offices:**
  - **Assignable / issuing set** (has `code`, used for notice numbers + staff assignment): `MAK` (Makindye), `KLA` (Kampala Central), `WAK` (Wakiso), `MUK` (Mukono), plus `NSG, NSK, LUW, KAW, NAK, RUB, KAY, BUV, BUI, GOM, MPI, BUT` — all `region: "Central"` — and `HQ` (Headquarters).
  - **Referral-target set** (the full 140-district roster in `UGANDA_DISTRICT_SEED`): `type: "DISTRICT_OFFICE"`, id `loc-<slug>`, **no `code`, no `officialEmail`** (district emails are typed per referral, never stored). Regions use the 6-value `Region` vocab (§3).
- **HQ departments:** Legal Department (`legal@nira.go.ug`), Client Relations Office (`clientrelations@nira.go.ug`), BDAR Office (`bdar@nira.go.ug`).
- **Services & reasons:** the full catalog in §3.
- **Notices:** a handful across different `caseStatus` and `service` values, including at least one card-collection district referral and one outreach referral.

---

## 8. Environment variables (return these to me)
- `DATABASE_URL`
- `JWT_SECRET`
- `EMAIL_PROVIDER_API_KEY` / SMTP settings
- `EMAIL_FROM_ADDRESS`
- `APP_ORIGIN` — public origin used to build QR verification URLs (`<APP_ORIGIN>/notice/:token`)
- (optional) `SMS_GATEWAY_*`

---

## 9. Frontend integration note
The frontend currently persists to `localStorage` via `DataStoreContext`. Once this
API exists, those calls are swapped for `fetch`/SWR against `NEXT_PUBLIC_API_BASE_URL`
using the identical field names above, so component code does not change. Keep the
response contract byte-for-byte aligned with the type blocks in §2–§3.

---

## 10. QR retrieval & referral tracking

Every issued notice must exist centrally, carry a unique Notice Number, generate an
**immutable** PDF, and generate a **secure QR** through which an authorised receiving
officer can retrieve and verify the original referral. A Client Services Outcome Notice
must never depend on the client owning an email address, having active SMS, or having
internet connectivity.

### Validity — no timed expiry
- The QR / referral does **NOT** expire after hours or days; clients may reasonably
  take time before reporting to the referred office.
- It stays valid until the notice is `CLOSED`, `CANCELLED`, or administratively
  archived under the organisation's records-retention policy.
- Expose validity as a boolean derived server-side: `valid = trackingStatus ∉ {CLOSED, CANCELLED}`.

### Retrieval token
- Long, random, **non-sequential** (≈32 base62 chars / ~190 bits). Generated server-side at issue.
- Must be unguessable — a notice must not be discoverable by incrementing a URL value
  or guessing notice numbers. The token, not the notice number, keys the public lookup.
- The QR encodes the absolute URL `<APP_ORIGIN>/notice/:token`.

### Tracking lifecycle (`TrackingStatus`, distinct from `CaseStatus`)
`CaseStatus` = internal NIRA workflow. `TrackingStatus` = the physical journey of the referral:

```
ISSUED  → set at issue.
VIEWED  → first time the public verify page is opened (GET /notice/verify/:token).
RECEIVED AT DESTINATION → a receiving officer acknowledges (POST .../acknowledge).
ACTIONED → optional: receiving office completed the service.
CLOSED / CANCELLED → terminal; referral no longer valid.
```
Transitions only move **forward** — `recordView` must not regress a referral already
past `ISSUED`; `updateTrackingStatus` (officer/admin) may set later stages incl. terminal.

### Two-level privacy on the public page
- **Public summary** (`GET /notice/verify/:token`): masked, minimal — Notice Number,
  office, issue date, service, destination, tracking status + validity, and any
  acknowledgement attribution. Enough to confirm authenticity, no sensitive PII.
- **Full view / PDF** (`.../full`, `.../pdf`): the complete referral document for the
  receiving officer, with `nin`/`phone` masked per §5.
- **Acknowledge** (`.../acknowledge`): authenticated receiving officer only; records
  who received it, which office, and when, and advances tracking to
  `RECEIVED AT DESTINATION`.

### Audit
Log view, acknowledgement, and every tracking-status change as `AuditEvent`s
(`action`, `fromValue`/`toValue`, `actorId`, `timestamp`).

> Frontend surfaces backed by this: success screen QR + share card, the immutable
> `NoticePreview`/PDF QR block, the public `/notice/[token]` page (View Full Notice,
> Download PDF, Acknowledge Referral), and the officer register-detail "Referral QR &
> tracking" card. Store methods: `findByToken`, `recordView`, `acknowledgeReferral`,
> `updateTrackingStatus`.
