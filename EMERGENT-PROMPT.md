# Emergent Build Prompt — NIRA Outcome Notice Backend

Copy everything in the fenced block below and paste it into Emergent as your build
instruction. Attach `API-CONTRACT.md` alongside it as the authoritative field-level
reference.

> **Updated 2026-08-09.** Reflects three changes vs. the prior version: (1) district
> office emails are officer-typed free text, not master-data lookups; (2) account
> credential lifecycle — default password `Welcome123`, `mustChangePassword`, forced
> first-login change, admin reset; (3) 6-region office vocabulary + 140-district seed.
> See the API-CONTRACT.md changelog for the field-level detail.

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
  mustChangePassword (forces a password change at next login), passwordHash.
- Notice: core record with client details, service, reasons[], action, destination,
  timeline, delivery/case statuses, priority, plus referral fields
  (referralDestinationType, referralOfficeId, referralDepartmentId, referralEmail,
  referralEmailStatus, referralEmailSentAt) and card-collection referral fields
  (cardLocationType, cardLocationOfficeId, cardLocationText, cardBatchNumber,
  receivingOfficeEmail, outreachContactStaffName, outreachContactStaffId,
  outreachContactStaffPhone).
- Office/District (admin-editable): id, name, code? (only on the assignable/issuing
  set; the 140 referral-target districts have no code), region (6-value vocab:
  Central | Mid Western | Eastern | Western | North Eastern | North Western), type.
  District offices do NOT store an email — officers type the receiving office email
  as free text per referral.
- HqDepartment: id, name, email, active.
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
- POST /notices — issue a notice. Server validates, generates noticeNumber
  (<OFFICE-CODE>/<YYYY>/<sequential>), persists referral fields into the record
  (office name + officer-typed receiving email + batch, or outreach location +
  staff; HQ referrals snapshot the department email) so later master-data edits
  never alter historic notices, sets initial delivery statuses,
  starts PDF generation, and for referrals with a receiving email sends the
  referral email and records referralEmailStatus/referralEmailSentAt. The notice
  MUST be saved before the email is attempted; a failed email must never lose the
  notice (mark pending/failed, keep the record).
- PATCH /notices/:id/case-status — transition case status (validate allowed
  transitions).
- POST /notices/:id/retry-delivery — re-attempt SMS/email delivery.
- POST /notices/:id/resend-referral-email — authorized resend; re-attempt and
  update status + timestamp + audit.
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
  Number, Client Phone, Referring Office, Referring Officer, Card Batch Number (if
  applicable), Receiving Office/Department, Service Requested, Reason, referral
  date/time, and the generated PDF attached. Card-collection subject:
  "NIRA Card Collection Referral – [NOTICE NUMBER] – [CLIENT NAME] – Batch [BATCH NUMBER]".
- Card-collection PDF must state the exact card location, batch number, receiving
  office email (district path) or contact staff member (outreach path), and the
  next-step action — never a vague "go to another NIRA office."
- District office email: the officer TYPES the receiving office email as free text
  per referral (persisted as referralEmail / receivingOfficeEmail). Do NOT look it
  up from master data and do NOT reject an office for lacking a stored email;
  validate the officer-supplied address for format only. HQ department referrals
  still use the department's stored email.
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
systems-admin) plus the roster, all with password "Welcome123" (seed accounts may
have mustChangePassword=false; newly created accounts always true). Seed the
assignable/issuing offices WITH codes (MAK, KLA, WAK, MUK, NSG, NSK, LUW, KAW, NAK,
RUB, KAY, BUV, BUI, GOM, MPI, BUT — all Central — plus HQ) and the full 140-district
referral-target roster WITHOUT codes or emails (6-region vocab). Seed the HQ
departments (Legal, Client Relations, BDAR) with emails, and the service/reason
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
