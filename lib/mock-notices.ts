import type { NoticeRecord } from "./nira"
import { serviceName, formatDate, noticeVerifyUrl, CURRENT_OFFICER } from "./nira"
import type { PreviewData } from "@/components/notice-preview"

export function noticeToPreview(n: NoticeRecord): PreviewData {
  const d = new Date(n.dateTime)
  return {
    noticeNumber: n.noticeNumber,
    office: n.office,
    officer: n.officer,
    officerTitle: n.officer === CURRENT_OFFICER.name ? CURRENT_OFFICER.title : "Registration Officer",
    dateLabel: formatDate(n.dateTime),
    timeLabel: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    clientName: n.clientName,
    phone: n.phone,
    nin: n.nin,
    email: n.email,
    serviceName: serviceName(n.service),
    reasons: n.reasons,
    action: n.action,
    destination: n.destination,
    referralEmail: n.referralEmail,
    cardLocationType: n.cardLocationType,
    cardLocationLabel: n.cardLocationText,
    cardBatchNumber: n.cardBatchNumber,
    cardReceivingEmail: n.receivingOfficeEmail,
    cardContactPerson: n.outreachContactStaffName
      ? [n.outreachContactStaffName, n.outreachContactStaffPhone].filter(Boolean).join(" · ")
      : undefined,
    timeline: n.timeline,
    additional: n.additional,
    verifyUrl: n.retrievalToken ? noticeVerifyUrl(n.retrievalToken) : undefined,
  }
}

export interface AuditEntry {
  time: string
  event: string
  actor: string
}

export interface DeliveryEvent {
  time: string
  channel: "SMS" | "Email" | "PDF"
  status: string
  detail?: string
}

export const MOCK_NOTICES: NoticeRecord[] = [
  {
    id: "n1",
    noticeNumber: "NIRA-MAK-20260802-00428",
    dateTime: "2026-08-02T09:12:00",
    clientName: "Sarah Nakato",
    phone: "+256 772 145 678",
    email: "sarah.nakato@example.ug",
    nin: "CM90012345ABCD",
    service: "collection",
    reasons: ["Card not yet available at the office"],
    action:
      "Await an SMS notification confirming your National ID card has arrived at this office, then return to collect it. Bring your collection slip.",
    destination: "Return to this office",
    timeline: "Await communication",
    officer: "Paul Kasawuli",
    office: "Makindye District Office",
    deliveryMethod: "sms-email",
    smsStatus: "Delivered",
    emailStatus: "Sent",
    pdfStatus: "Generated",
    caseStatus: "Awaiting NIRA Action",
    priority: "Medium",
    expectedCompletion: "2026-08-09",
  },
  {
    id: "n2",
    noticeNumber: "NIRA-MAK-20260802-00427",
    dateTime: "2026-08-02T09:05:00",
    clientName: "John Okello",
    phone: "+256 701 998 221",
    nin: "CM88054321WXYZ",
    service: "first-registration",
    reasons: ["Required document not presented", "Mandatory supporting information missing"],
    action:
      "Return to this office with the original required document(s) so the requested service can be completed.",
    destination: "Return to this office",
    timeline: "Within five working days",
    officer: "Grace Nabbosa",
    office: "Makindye District Office",
    deliveryMethod: "sms",
    smsStatus: "Delivered",
    pdfStatus: "Generated",
    caseStatus: "Awaiting Client Action",
    priority: "Low",
    expectedCompletion: "2026-08-07",
  },
  {
    id: "n3",
    noticeNumber: "NIRA-MAK-20260801-00399",
    dateTime: "2026-08-01T14:32:00",
    clientName: "Amina Namusoke",
    phone: "+256 758 334 010",
    email: "amina.n@example.ug",
    service: "renewal",
    reasons: ["Records could not be verified"],
    action: "Await verification of your records by NIRA. You will be contacted when verification is complete.",
    destination: "Await communication from NIRA",
    timeline: "Within two working days",
    officer: "Paul Kasawuli",
    office: "Makindye District Office",
    deliveryMethod: "sms-email",
    smsStatus: "Failed",
    emailStatus: "Delivered",
    pdfStatus: "Generated",
    caseStatus: "Under Review",
    priority: "High",
    expectedCompletion: "2026-08-04",
  },
  {
    id: "n4",
    noticeNumber: "NIRA-KLA-20260801-00381",
    dateTime: "2026-08-01T11:20:00",
    clientName: "Peter Ochieng",
    phone: "+256 782 456 789",
    nin: "CM91078900PQRS",
    service: "replacement",
    reasons: ["Required document not presented"],
    action: "Return with the police report confirming loss of the National ID card.",
    destination: "Police",
    timeline: "Within five working days",
    officer: "John Okello",
    office: "Kampala Central Office",
    deliveryMethod: "sms",
    smsStatus: "Delivered",
    pdfStatus: "Generated",
    caseStatus: "Awaiting Client Action",
    priority: "Medium",
    expectedCompletion: "2026-08-06",
  },
  {
    id: "n5",
    noticeNumber: "NIRA-MAK-20260731-00355",
    dateTime: "2026-07-31T16:02:00",
    clientName: "Grace Nabbosa",
    phone: "+256 772 010 233",
    email: "grace.nabbosa@example.ug",
    service: "correction",
    reasons: ["Mandatory supporting information missing"],
    action: "Return with a certified copy of your birth certificate to support the correction request.",
    destination: "Return to this office",
    timeline: "On a specific date",
    officer: "Amina Namusoke",
    office: "Makindye District Office",
    deliveryMethod: "sms-email",
    smsStatus: "Delivered",
    emailStatus: "Delivered",
    pdfStatus: "Generated",
    caseStatus: "Resolved",
    priority: "Low",
    expectedCompletion: "2026-08-01",
  },
  {
    id: "n6",
    noticeNumber: "NIRA-WAK-20260731-00340",
    dateTime: "2026-07-31T10:44:00",
    clientName: "Moses Kato",
    phone: "+256 700 556 342",
    service: "collection",
    reasons: ["Card is available at another NIRA District Office"],
    action: "Proceed to the indicated NIRA District Office for card collection and present this notice where applicable.",
    destination: "NIRA – Kampala Central District Office",
    cardLocationType: "DISTRICT_OFFICE",
    cardLocationOfficeId: "loc-kampala-central",
    cardLocationText: "NIRA Kampala Central District Office",
    cardBatchNumber: "CTRL-2026-0231",
    receivingOfficeEmail: "kampala.central@nira.go.ug",
    referralEmail: "central.division@nira.go.ug",
    referralEmailStatus: "sent",
    referralEmailSentAt: "2026-07-31T10:46:00",
    timeline: "Same day",
    officer: "Peter Ochieng",
    office: "Wakiso District Office",
    deliveryMethod: "sms",
    smsStatus: "Delivered",
    pdfStatus: "Generated",
    caseStatus: "Resolved",
    priority: "Low",
  },
  {
    id: "n7",
    noticeNumber: "NIRA-MAK-20260730-00318",
    dateTime: "2026-07-30T13:15:00",
    clientName: "Esther Auma",
    phone: "+256 759 887 100",
    email: "esther.auma@example.ug",
    nin: "CM87012399LMNO",
    service: "birth-certification",
    reasons: ["Another NIRA service must be completed first"],
    action: "Complete the prerequisite NIRA service first, then return to continue with this request.",
    destination: "Return to this office",
    timeline: "Within two working days",
    officer: "Paul Kasawuli",
    office: "Makindye District Office",
    deliveryMethod: "sms-email",
    smsStatus: "Delivered",
    emailStatus: "Failed",
    pdfStatus: "Generated",
    caseStatus: "Escalated",
    priority: "High",
    expectedCompletion: "2026-07-31",
  },
  {
    id: "n8",
    noticeNumber: "NIRA-MUK-20260730-00305",
    dateTime: "2026-07-30T08:58:00",
    clientName: "David Ssemwogerere",
    phone: "+256 772 445 667",
    service: "renewal",
    reasons: ["System or network interruption"],
    action: "Return to this office once system services have been restored. No additional documents are required.",
    destination: "Return to this office",
    timeline: "Same day",
    officer: "Grace Nabbosa",
    office: "Mukono District Office",
    deliveryMethod: "sms",
    smsStatus: "Delivered",
    pdfStatus: "Generated",
    caseStatus: "Resolved",
    priority: "Low",
  },
  {
    id: "n9",
    noticeNumber: "NIRA-MAK-20260729-00287",
    dateTime: "2026-07-29T15:41:00",
    clientName: "Betty Nakimuli",
    phone: "+256 701 223 908",
    email: "betty.n@example.ug",
    nin: "CM92034512TUVW",
    service: "first-registration",
    reasons: ["Biometric verification unsuccessful"],
    action: "Return to this office to repeat biometric capture. Ensure hands are clean and dry.",
    destination: "Return to this office",
    timeline: "Within two working days",
    officer: "Amina Namusoke",
    office: "Makindye District Office",
    deliveryMethod: "sms-email",
    smsStatus: "Delivered",
    emailStatus: "Delivered",
    pdfStatus: "Generated",
    caseStatus: "Awaiting Client Action",
    priority: "Medium",
    expectedCompletion: "2026-07-31",
  },
  {
    id: "n10",
    noticeNumber: "NIRA-KLA-20260729-00271",
    dateTime: "2026-07-29T09:33:00",
    clientName: "Robert Mugisha",
    phone: "+256 782 776 500",
    service: "confirmation",
    reasons: ["Application still under review"],
    action: "Await communication from NIRA. Your application is still under review.",
    destination: "Await communication from NIRA",
    timeline: "Await communication",
    officer: "John Okello",
    office: "Kampala Central Office",
    deliveryMethod: "sms",
    smsStatus: "Pending",
    pdfStatus: "Generated",
    caseStatus: "Under Review",
    priority: "Medium",
    expectedCompletion: "2026-08-03",
  },
  {
    id: "n11",
    noticeNumber: "NIRA-MAK-20260728-00256",
    dateTime: "2026-07-28T12:09:00",
    clientName: "Florence Akello",
    phone: "+256 758 119 044",
    email: "florence.akello@example.ug",
    service: "correction",
    reasons: ["Record requires further investigation"],
    action: "Await communication from NIRA while your record is investigated.",
    destination: "NIRA Headquarters",
    timeline: "Within five working days",
    officer: "Paul Kasawuli",
    office: "Makindye District Office",
    deliveryMethod: "sms-email",
    smsStatus: "Delivered",
    emailStatus: "Delivered",
    pdfStatus: "Generated",
    caseStatus: "Awaiting NIRA Action",
    priority: "High",
    expectedCompletion: "2026-07-30",
  },
  {
    id: "n12",
    noticeNumber: "NIRA-MAK-20260728-00244",
    dateTime: "2026-07-28T08:47:00",
    clientName: "Ronald Kiggundu",
    phone: "+256 772 663 221",
    service: "replacement",
    reasons: ["Client attended the wrong office"],
    action: "Attend the correct NIRA office indicated by the serving officer to complete this service.",
    destination: "NIRA – Wakiso District Office",
    referralDestinationType: "DISTRICT_OFFICE",
    referralOfficeId: "loc-wakiso",
    timeline: "No return required",
    officer: "Grace Nabbosa",
    office: "Makindye District Office",
    deliveryMethod: "print",
    smsStatus: "Pending",
    pdfStatus: "Generated",
    caseStatus: "Cancelled",
    priority: "Low",
  },
  {
    id: "n13",
    noticeNumber: "NIRA-MAK-20260727-00231",
    dateTime: "2026-07-27T14:22:00",
    clientName: "Joan Nabirye",
    phone: "+256 701 445 887",
    email: "joan.nabirye@example.ug",
    service: "getfirst-id",
    reasons: ["Current eligibility requirements not satisfied"],
    action: "Satisfy the outstanding eligibility requirement(s) and return to this office to continue.",
    destination: "Return to this office",
    timeline: "Within five working days",
    officer: "Amina Namusoke",
    office: "Makindye District Office",
    deliveryMethod: "sms-email",
    smsStatus: "Queued",
    emailStatus: "Queued",
    pdfStatus: "Pending",
    caseStatus: "Issued",
    priority: "Low",
    expectedCompletion: "2026-08-01",
  },
]

export function auditTrailFor(n: NoticeRecord): AuditEntry[] {
  const base = new Date(n.dateTime)
  const t = (mins: number) => new Date(base.getTime() + mins * 60000).toISOString()
  const entries: AuditEntry[] = [
    { time: t(0), event: "Notice created and issued", actor: n.officer },
    { time: t(0), event: "PDF notice generated", actor: "System" },
  ]
  if (n.deliveryMethod !== "print") {
    entries.push({ time: t(1), event: "SMS queued for delivery", actor: "System" })
    if (n.smsStatus === "Delivered") entries.push({ time: t(2), event: "SMS delivered to client", actor: "System" })
    if (n.smsStatus === "Failed") entries.push({ time: t(2), event: "SMS delivery failed", actor: "System" })
  }
  if (n.emailStatus) {
    entries.push({ time: t(1), event: "Email dispatched with PDF notice", actor: "System" })
    if (n.emailStatus === "Delivered") entries.push({ time: t(3), event: "Email delivered", actor: "System" })
  }
  if (n.caseStatus === "Resolved") entries.push({ time: t(2880), event: "Case marked as resolved", actor: n.officer })
  if (n.caseStatus === "Escalated") entries.push({ time: t(1440), event: "Case escalated for review", actor: n.officer })
  return entries
}

export function deliveryHistoryFor(n: NoticeRecord): DeliveryEvent[] {
  const base = new Date(n.dateTime)
  const t = (mins: number) => new Date(base.getTime() + mins * 60000).toISOString()
  const events: DeliveryEvent[] = []
  if (n.deliveryMethod !== "print") {
    events.push({ time: t(1), channel: "SMS", status: "Queued" })
    events.push({
      time: t(2),
      channel: "SMS",
      status: n.smsStatus,
      detail: n.smsStatus === "Failed" ? "Network operator rejected the message. Retry available." : undefined,
    })
  }
  if (n.emailStatus) {
    events.push({ time: t(1), channel: "Email", status: "Sent" })
    events.push({
      time: t(3),
      channel: "Email",
      status: n.emailStatus,
      detail: n.emailStatus === "Failed" ? "Recipient mailbox unavailable." : undefined,
    })
  }
  events.push({ time: t(0), channel: "PDF", status: n.pdfStatus })
  return events.sort((a, b) => a.time.localeCompare(b.time))
}
