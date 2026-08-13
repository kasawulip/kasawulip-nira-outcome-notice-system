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
> 4. **Issuance hardening (permanent fix for the `POST /notices` 500 on HQ/BDAR referrals).** PDF and referral-email are best-effort side effects wrapped in try/catch **after** the notice is committed; a notice is issued as `201` even if email is unconfigured or fails (status degrades to `pending`/`failed`). A `500` is now only legitimate if the DB write of the notice itself fails. Added an exhaustive error contract table and a global failure-isolation rule. Email/SMS env vars are explicitly optional. Affects §5 issue flow, Delivery, §8.
> 5. **NIRA Headquarters as an assignable/referring office.** HQ (`code "HQ"`) joins the assignable set; HQ `district-staff` must carry a `department` (one of 6 `HQ_DIRECTORATES`: BDAR, Client Relations, General, Identification Services, Legal, Marriages). Notices issued from HQ carry a required `referringDepartment` snapshot, printed on the notice and included in the referral email. New rule: **no HQ→HQ referral** (districts unchanged). The 6 directorates now drive both staff assignment and the HQ referral picker. Affects §2 (User, Notice), §3 (Office, HqDepartment), §5, §6.

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
  district: string        // office name, or "All Districts" for admin (national scope). May be a field district OR "NIRA Headquarters".
  department?: string      // REQUIRED when district == "NIRA Headquarters": the officer's directorate (one of §3 HQ_DIRECTORATES). Omitted for district officers and admins.
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
  office: string                // issuing office (scope key); may be a district OR "NIRA Headquarters"
  referringDepartment?: string  // referring officer's HQ directorate (one of §3 HQ_DIRECTORATES). Set ONLY when office == "NIRA Headquarters"; printed on the notice. Snapshot literal.
  deliveryMethod: "sms" | "email" | "print"
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

> **NIRA Headquarters is a first-class assignable/issuing office** (name exactly
> `"NIRA Headquarters"`, code `"HQ"`, type `"HEADQUARTERS"`), part of the assignable set
> alongside the field districts. Staff can be assigned to it and it can issue and refer
> notices. It differs from a district in one way only: it can **never** be a referral
> *destination from itself* — see the no-HQ→HQ rule in §6.

> **Integrity rule (UPDATED — reverses the previous rule):** District office emails are
> **NOT** stored in master data. At referral time the officer **types the receiving
> office email as free text** (a faint `example@nira.go.ug` placeholder guides them),
> and the API persists that client-supplied value verbatim as `referralEmail` /
> `receivingOfficeEmail`. The API must **not** reject a district office for lacking an
> `officialEmail`, and must **not** derive the address from master data. Validate the
> officer-supplied email for **format only** (§6). This applies to **HQ-section referrals
> too**: the officer types the receiving department email; it is never taken from the
> department's stored `email`.

### HqDepartment  (master data — frontend type: `HeadquartersDepartment`)

```ts
{ id: string; name: string; email: string; active: boolean }
```

> The 6 HQ directorates/departments (canonical `HQ_DIRECTORATES`, names): **BDAR,
> Client Relations, General, Identification Services, Legal, Marriages**. This one list
> drives BOTH (a) the directorate a HQ officer is attached to (`User.department`) and
> (b) the section a client can be referred to at HQ. The `email` is a suggested default
> only — the officer still types the receiving address per referral (rule above).

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

> **Golden rule: issuance MUST NOT return 5xx because of PDF, email, SMS, or any other
> post-persist side effect.** The only failures allowed to stop issuance are (a) request
> validation (→ `400`) and (b) the atomic DB write of the notice itself (→ `500`, and only
> that). Everything after the notice row is committed — PDF rendering, email send,
> attachment, SMS — is a **best-effort side effect** that MUST be wrapped in its own
> try/catch and degrade to a stored status. A referral to HQ (e.g. BDAR) or to another
> district office is the common trigger for this; it must succeed even if email is
> completely unconfigured.

1. **Validate payload (§6) only.** Field-level problems (missing/invalid `referralEmail`, bad phone, unknown office, disabled `deliveryMethod` channel) return **`400`** with a machine-readable `{ error, field, message }` — never a `500`, never a silent pass. Validate the officer-supplied referral email for **format only**; do **not** consult master data.
2. **Persist the notice atomically FIRST**, inside a DB transaction: generate `noticeNumber`, a secure random `retrievalToken`, set `trackingStatus = "ISSUED"`, and write all referral fields (step 3). Commit. If and only if this commit fails do you return `500`. Once committed, the request is already a success — the response is `201` regardless of what happens in steps 4–6.
3. Referral fields written in step 2:
   - District card path → `cardLocationText = "NIRA <name> District Office"`, `receivingOfficeEmail = <officer-typed free-text email>` (client-supplied), `cardBatchNumber`.
   - District office referral (destination = "Another NIRA District Office") → `referralEmail = <officer-typed free-text email>` (client-supplied).
   - Outreach card path → `cardLocationText = <free-text location>`, `outreachContactStaffName` (+ optional phone), `cardBatchNumber`.
   - HQ department referral (destination = "NIRA Headquarters") → `referralEmail = <officer-typed free-text email>` (client-supplied). The department selection identifies the receiving section; the address itself is **typed per referral, never derived from master data**.
4. **Generate the PDF — in its own try/catch.** This PDF is the exact, immutable outcome-notice document issued to the client (identical to `GET /notices/:id/pdf`). On any failure set `pdfStatus = "failed"`, log it, and continue — the notice stays issued and the PDF can be regenerated on demand by `GET /notices/:id/pdf`. Never let a PDF error bubble up.
5. Set initial delivery statuses per `deliveryMethod` and enabled channels (pure in-memory computation; cannot fail the request).
6. **Mandatory referral auto-send — in its own try/catch, after commit.** For **every** referral (HQ section OR another NIRA district office), immediately after step 4, automatically email the exact-copy PDF to the officer-typed `referralEmail`. Record `referralEmailStatus` (`pending` → `sent`/`failed`) and `referralEmailSentAt`. Failure modes and their required (non-throwing) outcomes:
   - Email provider env vars missing/unconfigured (e.g. no `RESEND_API_KEY`/`MAIL_FROM`) → set `referralEmailStatus = "pending"`, log a warning, continue. **Do not throw.**
   - PDF unavailable (step 4 failed) → `referralEmailStatus = "pending"`, continue.
   - Provider/SMTP/network/attachment error → `referralEmailStatus = "failed"`, log the provider error, continue.
7. **A failed PDF/email must never lose or un-issue the notice** — the record is kept, statuses reflect reality, and an authorized resend is available (`POST /notices/:id/resend-referral-email`, which re-runs step 4+6 safely). The `201` response returns the full notice including `pdfStatus` and `referralEmailStatus` so the client can surface "issued, email pending/failed" instead of an error.

### Error contract for `POST /notices` (exhaustive)
| Situation | HTTP | Body | Notice persisted? |
|---|---|---|---|
| Invalid/missing field (incl. referralEmail, disabled channel) | `400` | `{ error:"validation", field, message }` | No |
| Not authenticated / wrong role / office scope | `401`/`403` | `{ error }` | No |
| DB write of the notice fails | `500` | `{ error:"persist_failed" }` | No |
| Notice committed; PDF failed | `201` | notice w/ `pdfStatus:"failed"` | **Yes** |
| Notice committed; email unconfigured | `201` | notice w/ `referralEmailStatus:"pending"` | **Yes** |
| Notice committed; email send failed | `201` | notice w/ `referralEmailStatus:"failed"` | **Yes** |
| Notice committed; everything sent | `201` | notice w/ `sent` statuses | **Yes** |

> A `500` from `POST /notices` therefore has exactly one legitimate cause: the notice row
> could not be written. Any other `500` (email, PDF, SMS, null department lookup, missing
> migration column) is a bug — fix by isolating that step, not by failing the request.

### Referral email content (must include)
Notice Number · Client Full Name · NIN/Application Number · Client Phone · Referring Office (incl. `referringDepartment` when issued from NIRA Headquarters, e.g. "NIRA Headquarters · BDAR") · Referring Officer · Card Batch Number (if applicable) · Receiving Office/Department · Service Requested · Reason · referral date & time · **the generated outcome-notice PDF attached, byte-for-byte identical to the client's issued notice**.

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
- Use a real transactional email provider (SMTP/SendGrid/Resend, env-configurable) for referral emails.
- **The email provider is optional infrastructure, not a hard dependency.** The API must boot and issue notices with the email env vars absent or invalid. When they are missing, treat the referral send as `pending` (queued for later), never as a startup crash or a request failure. Validate provider config lazily at send time inside the try/catch, not at import/boot time.
- **`POST /notices/:id/resend-referral-email`** re-runs PDF generation + send with the same failure isolation as the issue flow: it returns `200` with the updated `referralEmailStatus` even when the send fails (so the UI shows "still failed"), and only returns `4xx`/`5xx` for auth or a missing notice — never for a provider error.
- If no SMS gateway is configured, simulate SMS status transitions (`Pending → Queued → Sent → Delivered`, with occasional `Failed`). SMS is never a hard dependency either.

### Robustness / failure isolation (applies to ALL endpoints)
- **Every side effect is wrapped.** PDF rendering, email/SMS sending, QR generation, audit-log writes, and any third-party/network call run inside try/catch and degrade to a stored status or a logged warning. They never propagate as a `5xx` on the primary request.
- **A `500` always means an unexpected server bug**, never an expected/handled condition. Expected problems map to `400` (validation), `401/403` (auth), `404` (missing), `409` (conflict, e.g. duplicate offline id). Add a global error handler so any uncaught exception returns a JSON `{ error }` with a logged stack trace — but the goal is that no handled path ever reaches it.
- **Schema is authoritative and migrated before deploy.** Every field this contract adds (`referralEmail`, `receivingOfficeEmail`, `mustChangePassword`, `deliveryMethod` enum without `sms-email`, channel-settings) must exist in the DB with the correct nullability. A missing column / enum-value / NOT-NULL surprise is the classic hidden `500`; run and verify migrations, and default nullable columns rather than hard-failing inserts.
- **Never dereference optional master data.** HQ department / office lookups may return null (address is officer-typed now); guard every such access. A null lookup must never throw.

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
- **HQ staff attachment:** a `district-staff` user whose `district == "NIRA Headquarters"` MUST have a `department` set to one of the 6 `HQ_DIRECTORATES`. Reject account create/update that omits it (`400`).
- **No HQ → HQ referral:** if the issuing `office == "NIRA Headquarters"`, reject any notice whose referral destination is `"NIRA Headquarters"` (`400`). HQ may still refer to any district and to the non-NIRA destinations; districts are unchanged and may still refer to HQ.
- **Referring department capture:** when the issuing `office == "NIRA Headquarters"`, `referringDepartment` is required and must be one of the 6 `HQ_DIRECTORATES`; persist it as a literal snapshot and print it on the notice. For non-HQ offices it must be absent.

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
Required for the API to run:
- `DATABASE_URL`
- `JWT_SECRET`
- `APP_ORIGIN` — public origin used to build QR verification URLs (`<APP_ORIGIN>/notice/:token`)

Optional — the API MUST boot and issue notices without these; their absence degrades the
referral send to `pending` (see Delivery / Robustness), it never blocks issuance:
- `EMAIL_PROVIDER_API_KEY` / SMTP settings
- `EMAIL_FROM_ADDRESS`
- `SMS_GATEWAY_*`

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
