# Emergent Build Prompt — NIRA Outcome Notice Backend

Copy everything in the fenced block below and paste it into Emergent as your build
instruction. Attach `API-CONTRACT.md` alongside it as the authoritative field-level
reference.

> **Updated 2026-08-09.** Reflects five changes vs. the prior version: (1) district
> office emails are officer-typed free text, not master-data lookups; (2) account
> credential lifecycle — default password `Welcome123`, `mustChangePassword`, forced
> first-login change, admin reset; (3) 6-region office vocabulary + 140-district seed;
> (4) issuance hardening — PDF/email are best-effort side effects after the notice is
> committed, so `POST /notices` never returns 500 for a delivery failure (permanent fix
> for the HQ/BDAR 500); (5) NIRA Headquarters is an assignable/issuing office — HQ staff
> carry a department (6 directorates), HQ-issued notices carry a printed referringDepartment,
> and HQ→HQ referrals are blocked. See the API-CONTRACT.md changelog for the field-level detail.

---

```
Build the backend and REST API for an existing Next.js frontend — the NIRA
"Client Services Outcome Notice" system. Do NOT rebuild or restyle the frontend;
only build the API it will call. Expose a JSON REST API, return an OpenAPI/Swagger
spec, and give me the base URL so I can set it as NEXT_PUBLIC_API_BASE_URL in the
frontend. An attached file, API-CONTRACT.md, is the authoritative field-level spec —
match its field names, enums, and master data exactly.

DOMAIN
NIRA (Uganda's national ID authority) officers issue "outcome notices" to clients
when a service can't be completed in one visit. Notices are delivered by
SMS/email/print, generate a PDF, and are tracked as cases. Some notices are
referrals that must email a receiving office.

TECH EXPECTATIONS
- REST, JSON request/response, resource-oriented routes.
- JWT (or session) auth with two roles: district-staff and systems-admin.
- Data scoping is mandatory: district-staff may only read/write notices for their
  own office; systems-admin has national scope. Enforce on every endpoint
  server-side; never trust a client-supplied office.
- Timestamps in ISO 8601. Server generates all IDs, notice numbers, and timestamps.
- Pagination + filtering on list endpoints.

ENTITIES (see API-CONTRACT.md for exact fields)
- User: id, name, title, role, office/district, initials, active, email,
  mustChangePassword (forces a password change at next login), passwordHash,
  department? (REQUIRED when district == "NIRA Headquarters"; one of the 6 HQ
  directorates below).
- Notice: core record with client details, service, reasons[], action, destination,
  timeline, delivery/case statuses, priority, referringDepartment? (referring officer's
  HQ directorate — set only when the issuing office is NIRA Headquarters; printed on the
  notice), plus referral fields (referralDestinationType, referralOfficeId,
  referralDepartmentId, referralEmail, referralEmailStatus, referralEmailSentAt) and
  card-collection referral fields (cardLocationType, cardLocationOfficeId,
  cardLocationText, cardBatchNumber, receivingOfficeEmail, outreachContactStaffName,
  outreachContactStaffId, outreachContactStaffPhone).
- Office/District (admin-editable): id, name, code? (only on the assignable/issuing
  set; the 140 referral-target districts have no code), region (6-value vocab:
  Central | Mid Western | Eastern | Western | North Eastern | North Western), type.
  District offices do NOT store an email — officers type the receiving office email
  as free text per referral. NIRA Headquarters (name "NIRA Headquarters", code "HQ",
  type HEADQUARTERS) is a first-class assignable/issuing office in this set.
- HqDepartment: id, name, email, active. The 6 canonical HQ directorates are BDAR,
  Client Relations, General, Identification Services, Legal, Marriages — this single
  list drives both a HQ officer's attached department and the HQ referral destination.
- Service: fixed NIRA service list with allowed reasons per service.
- AuditEvent: append-only log of issue, delivery attempts, referral emails,
  case-status changes, resends.
- DeliveryLog: per-notice delivery attempts (channel, status, timestamp, error?).

ENDPOINTS (minimum)
- POST /auth/login, POST /auth/logout, GET /auth/me (all return
  user.mustChangePassword so the frontend can force a first-login change)
- POST /auth/change-password — self; body { currentPassword, newPassword };
  clears mustChangePassword on success
- GET /notices (filter by office, caseStatus, service, date range, search;
  paginated; auto-scoped by role), GET /notices/:id
- POST /notices — issue a notice. GOLDEN RULE: this endpoint MUST NOT return 5xx
  because of PDF, email, or SMS. Order: (1) validate payload only — bad input returns
  400 with { error, field, message }, never 500; (2) persist the notice atomically in a
  DB transaction (generate noticeNumber <OFFICE-CODE>/<YYYY>/<sequential>, retrievalToken,
  trackingStatus=ISSUED, and write referral fields — office/department name +
  officer-typed receiving email for BOTH district-office and HQ-section referrals, batch,
  or outreach location + staff; plus referringDepartment when the issuing office is NIRA
  Headquarters, rejecting HQ-issued notices that omit it or that target HQ as destination). Only a failed commit may return 500; once committed the
  response is 201 no matter what follows. (3) Generate the PDF in its own try/catch
  (on failure pdfStatus="failed", continue). (4) Set delivery statuses. (5) For EVERY
  referral (HQ section or another district office) auto-email the exact-copy PDF to the
  officer-typed referralEmail in its own try/catch — email env vars missing => status
  "pending", send error => status "failed", always continue. Record
  referralEmailStatus/referralEmailSentAt. The 201 body returns pdfStatus +
  referralEmailStatus so the UI can show "issued, email pending/failed". A failed PDF or
  email must NEVER un-issue or lose the notice. (This permanently fixes the 500 seen on
  HQ/BDAR referrals: it was a post-persist side effect throwing — isolate it, don't fail
  the request.)
- PATCH /notices/:id/case-status — transition case status (validate allowed
  transitions).
- POST /notices/:id/retry-delivery — re-attempt SMS/email delivery.
- POST /notices/:id/resend-referral-email — authorized resend; re-run PDF + send with
  the same failure isolation; return 200 with the updated referralEmailStatus even when
  the send fails (never 5xx for a provider error), 4xx only for auth / missing notice.
- GET /notices/:id/pdf — return the generated outcome-notice PDF.
- POST /sync/outbox — accept a batch of notices created offline; persist
  idempotently by client-supplied id; return accepted/queued results.
- Master data: GET /offices, GET /offices/:id, GET /hq-departments, GET /services;
  admin CRUD on offices/departments/users.
- Users/admin: GET/POST/PATCH /users, PATCH /users/:id/active. POST /users creates
  the account with default password "Welcome123" + mustChangePassword=true (client
  sends no password). POST /users/:id/reset-password (admin) resets to "Welcome123"
  and re-arms mustChangePassword=true.
- Settings: GET/PATCH /channel-settings (sms/email/print toggles).

BUSINESS RULES
- Notice numbers are server-generated, sequential per office per year, never reused.
- Referral emails must include: Notice Number, Client Full Name, NIN/Application
  Number, Client Phone, Referring Office (with referringDepartment when issued from
  NIRA Headquarters, e.g. "NIRA Headquarters · BDAR"), Referring Officer, Card Batch
  Number (if applicable), Receiving Office/Department, Service Requested, Reason, referral
  date/time, and the generated PDF attached. Card-collection subject:
  "NIRA Card Collection Referral – [NOTICE NUMBER] – [CLIENT NAME] – Batch [BATCH NUMBER]".
- Card-collection PDF must state the exact card location, batch number, receiving
  office email (district path) or contact staff member (outreach path), and the
  next-step action — never a vague "go to another NIRA office."
- Receiving referral email (BOTH district-office AND HQ-section referrals): the
  officer TYPES it as free text per referral (persisted as referralEmail /
  receivingOfficeEmail). It is a required, captured field on every referral. Do NOT
  look it up from master data (the HQ department selection only identifies the
  section, not the address) and do NOT reject an office for lacking a stored email;
  validate the officer-supplied address for format only.
- NIRA Headquarters office rules: (a) HQ is assignable/issuing like a district;
  (b) a district-staff user assigned to HQ MUST have a department (one of the 6
  directorates) — reject creation without it; (c) NO HQ->HQ referral: when the issuing
  office is NIRA Headquarters, reject a notice whose referral destination is NIRA
  Headquarters (HQ may still refer to any district and to non-NIRA destinations; districts
  are unchanged and may still refer to HQ); (d) when the issuing office is HQ, capture a
  required referringDepartment (one of the 6), snapshot it literally, and print it on the
  notice as the referring section (e.g. "NIRA Headquarters · BDAR").
- Mandatory referral auto-send: immediately after a referral notice is generated,
  the system MUST automatically email the exact-copy outcome-notice PDF (byte-for-
  byte identical to the client's issued notice, same as GET /notices/:id/pdf) to the
  officer-typed referralEmail. Not optional, not user-triggered.
- Failure isolation (permanent 500 prevention): every side effect — PDF render,
  email/SMS send, attachment, QR, audit write, any network/third-party call — runs in
  its own try/catch and degrades to a stored status or logged warning; none may surface
  as a 5xx on the primary request. A 500 must only ever mean an unexpected bug or a
  failed DB write, never an expected/handled condition. Expected problems map to
  400/401/403/404/409. Add a global error handler that returns JSON { error } and logs
  the stack, but no handled path should reach it.
- The email/SMS provider is OPTIONAL infrastructure: the API must boot and issue
  notices with those env vars absent or invalid; validate provider config lazily at
  send time (inside the try/catch), never at import/boot.
- Migrate the DB schema before deploy so every field this spec adds (referralEmail,
  receivingOfficeEmail, mustChangePassword, deliveryMethod enum sms|email|print with old
  "sms-email" migrated to "email", channel settings) exists with correct nullability — a
  missing column / enum value / NOT-NULL surprise is the classic hidden 500. Never
  dereference optional master data (HQ department / office lookups may be null now that
  the address is officer-typed); guard every such access.
- Account credentials: new users start with default password "Welcome123" and
  mustChangePassword=true; the app is blocked until they change it at first login.
  Admin reset restores "Welcome123" and re-arms the flag. Hash passwords; never
  return them.
- PII: store NIN and phone in full but mask them in list/summary responses; log
  access to full NIN in the audit trail.
- Validation: Uganda phone format, email format, required fields per service/reason
  pathway.
- Use a real transactional email provider (SMTP/SendGrid) for referral emails,
  configurable by env var; simulate SMS delivery status transitions if no SMS
  gateway is provided.

SEED DATA
Seed two demo users (one district-staff in "Makindye District Office", one
systems-admin, one district-staff attached to "NIRA Headquarters" with department
"BDAR") plus the roster, all with password "Welcome123" (seed accounts may
have mustChangePassword=false; newly created accounts always true). Seed the
assignable/issuing offices WITH codes (MAK, KLA, WAK, MUK, NSG, NSK, LUW, KAW, NAK,
RUB, KAY, BUV, BUI, GOM, MPI, BUT — all Central — plus HQ = "NIRA Headquarters",
type HEADQUARTERS) and the full 140-district referral-target roster WITHOUT codes or
emails (6-region vocab). Seed all 6 HQ departments (BDAR, Client Relations, General,
Identification Services, Legal, Marriages) with emails, and the service/reason
catalog. Seed a handful of example notices across different case statuses.

DELIVERABLE
The running API, OpenAPI spec, Postman collection, seed script, and the environment
variables I need to set. Keep the response contract exactly matching API-CONTRACT.md
so the frontend consumes it with minimal mapping.
```

---

## How to use this

1. Paste the fenced block above into Emergent.
2. Attach `API-CONTRACT.md` in the same conversation as the field-level reference.
3. Ask Emergent to build in two passes if the first output is thin:
   - **Pass 1:** auth (incl. change-password + admin reset + mustChangePassword) + notices CRUD + master data + role scoping.
   - **Pass 2:** referral email sending (officer-typed free-text addresses) + PDF generation + offline `/sync/outbox`.
4. Ask for the OpenAPI spec + Postman collection so you can test endpoints before
   wiring the frontend.
5. When you have the base URL, I can replace the `localStorage` calls in
   `DataStoreContext` with `fetch`/SWR against `NEXT_PUBLIC_API_BASE_URL` — no
   component changes needed, since the data shapes stay identical.
