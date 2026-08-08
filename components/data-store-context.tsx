"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  ALL_DISTRICTS,
  DEFAULT_CHANNEL_SETTINGS,
  SEED_ACCOUNTS,
  generateRetrievalToken,
  type CaseStatus,
  type DeliveryChannelSettings,
  type NoticeRecord,
  type TrackingStatus,
  type UserAccount,
} from "@/lib/nira"
import { MOCK_NOTICES } from "@/lib/mock-notices"
import { useSession } from "@/components/session-context"

const NOTICES_KEY = "nira.notices"
const OUTBOX_KEY = "nira.outbox"
const ACCOUNTS_KEY = "nira.accounts"
const CHANNELS_KEY = "nira.channels"

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota / privacy-mode errors
  }
}

/** Ensure a notice has a retrieval token + tracking status (backfill legacy records). */
function withRetrievalDefaults(n: NoticeRecord): NoticeRecord {
  if (n.retrievalToken && n.trackingStatus) return n
  return {
    ...n,
    retrievalToken: n.retrievalToken ?? generateRetrievalToken(),
    trackingStatus: n.trackingStatus ?? "ISSUED",
  }
}

interface DataStoreValue {
  notices: NoticeRecord[] // committed / synced
  outbox: NoticeRecord[] // queued offline, awaiting sync
  combined: NoticeRecord[] // outbox first, then notices (newest-ish first)
  accounts: UserAccount[]
  channelSettings: DeliveryChannelSettings
  ready: boolean
  // notice actions
  issueNotice: (record: NoticeRecord, opts: { online: boolean }) => { queued: boolean }
  resolveCase: (id: string) => void
  updateCaseStatus: (id: string, status: CaseStatus) => void
  retryDelivery: (id: string) => void
  // Referral email to a receiving HQ department. Returns a promise resolving to
  // whether delivery succeeded so the caller can surface a status toast.
  sendReferralEmail: (id: string) => Promise<boolean>
  syncOutbox: () => number
  // QR retrieval + referral tracking
  findByToken: (token: string) => NoticeRecord | undefined
  recordView: (token: string) => void
  acknowledgeReferral: (token: string, by: { office: string; officer: string }) => void
  updateTrackingStatus: (id: string, status: TrackingStatus) => void
  // admin actions
  addAccount: (account: UserAccount) => void
  updateAccount: (id: string, patch: Partial<UserAccount>) => void
  toggleAccountActive: (id: string) => void
  updateChannelSettings: (patch: Partial<DeliveryChannelSettings>) => void
}

const DataStoreContext = createContext<DataStoreValue | null>(null)

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<NoticeRecord[]>([])
  const [outbox, setOutbox] = useState<NoticeRecord[]>([])
  const combinedRef = useRef<NoticeRecord[]>([])
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [channelSettings, setChannelSettings] = useState<DeliveryChannelSettings>(DEFAULT_CHANNEL_SETTINGS)
  const [ready, setReady] = useState(false)

  // Hydrate from localStorage once.
  useEffect(() => {
    const seeded = load<NoticeRecord[]>(NOTICES_KEY, MOCK_NOTICES.map((n) => ({ ...n, syncState: "synced" })))
    // Backfill QR retrieval tokens + tracking status for any legacy records so
    // every issued notice is retrievable and verifiable.
    setNotices(seeded.map(withRetrievalDefaults))
    setOutbox(load<NoticeRecord[]>(OUTBOX_KEY, []).map(withRetrievalDefaults))
    setAccounts(load<UserAccount[]>(ACCOUNTS_KEY, SEED_ACCOUNTS))
    setChannelSettings(load<DeliveryChannelSettings>(CHANNELS_KEY, DEFAULT_CHANNEL_SETTINGS))
    setReady(true)
  }, [])

  // Persist on change (after hydration).
  useEffect(() => {
    if (ready) save(NOTICES_KEY, notices)
  }, [notices, ready])
  useEffect(() => {
    if (ready) save(OUTBOX_KEY, outbox)
  }, [outbox, ready])
  useEffect(() => {
    if (ready) save(ACCOUNTS_KEY, accounts)
  }, [accounts, ready])
  useEffect(() => {
    if (ready) save(CHANNELS_KEY, channelSettings)
  }, [channelSettings, ready])

  const issueNotice = useCallback<DataStoreValue["issueNotice"]>((record, { online }) => {
    if (online) {
      setNotices((prev) => [{ ...record, syncState: "synced" }, ...prev])
      return { queued: false }
    }
    setOutbox((prev) => [{ ...record, syncState: "queued", createdOffline: true }, ...prev])
    return { queued: true }
  }, [])

  const resolveCase = useCallback<DataStoreValue["resolveCase"]>((id) => {
    const stamp = new Date().toISOString()
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, caseStatus: "Resolved", resolvedAt: stamp } : n)),
    )
  }, [])

  const updateCaseStatus = useCallback<DataStoreValue["updateCaseStatus"]>((id, status) => {
    setNotices((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, caseStatus: status, resolvedAt: status === "Resolved" ? new Date().toISOString() : n.resolvedAt }
          : n,
      ),
    )
  }, [])

  const retryDelivery = useCallback<DataStoreValue["retryDelivery"]>((id) => {
    setNotices((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              smsStatus: n.smsStatus === "Failed" ? "Sent" : n.smsStatus,
              emailStatus: n.emailStatus === "Failed" ? "Sent" : n.emailStatus,
            }
          : n,
      ),
    )
  }, [])

  const syncOutbox = useCallback<DataStoreValue["syncOutbox"]>(() => {
    let moved = 0
    setOutbox((queued) => {
      if (queued.length === 0) return queued
      moved = queued.length
      const synced = queued.map((n) => ({
        ...n,
        syncState: "synced" as const,
        smsStatus: n.deliveryMethod === "print" ? n.smsStatus : ("Sent" as const),
      }))
      setNotices((prev) => [...synced, ...prev])
      return []
    })
    return moved
  }, [])

  // Update the notice matching `token` in whichever list holds it (committed or
  // queued), applying `patch`.
  const patchByToken = useCallback((token: string, patch: (n: NoticeRecord) => NoticeRecord) => {
    setNotices((prev) => prev.map((n) => (n.retrievalToken === token ? patch(n) : n)))
    setOutbox((prev) => prev.map((n) => (n.retrievalToken === token ? patch(n) : n)))
  }, [])

  const findByToken = useCallback<DataStoreValue["findByToken"]>(
    (token) => combinedRef.current.find((n) => n.retrievalToken === token),
    [],
  )

  const recordView = useCallback<DataStoreValue["recordView"]>(
    (token) => {
      patchByToken(token, (n) =>
        // Only advance ISSUED → VIEWED; never regress a further-along referral.
        n.trackingStatus === "ISSUED"
          ? { ...n, trackingStatus: "VIEWED", viewedAt: n.viewedAt ?? new Date().toISOString() }
          : n,
      )
    },
    [patchByToken],
  )

  const acknowledgeReferral = useCallback<DataStoreValue["acknowledgeReferral"]>(
    (token, by) => {
      patchByToken(token, (n) => ({
        ...n,
        trackingStatus: "RECEIVED AT DESTINATION",
        acknowledgedAt: new Date().toISOString(),
        acknowledgedByOffice: by.office,
        acknowledgedByOfficer: by.officer,
      }))
    },
    [patchByToken],
  )

  const updateTrackingStatus = useCallback<DataStoreValue["updateTrackingStatus"]>((id, status) => {
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, trackingStatus: status } : n)))
    setOutbox((prev) => prev.map((n) => (n.id === id ? { ...n, trackingStatus: status } : n)))
  }, [])

  const addAccount = useCallback<DataStoreValue["addAccount"]>((account) => {
    setAccounts((prev) => [account, ...prev])
  }, [])

  const updateAccount = useCallback<DataStoreValue["updateAccount"]>((id, patch) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }, [])

  const toggleAccountActive = useCallback<DataStoreValue["toggleAccountActive"]>((id) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)))
  }, [])

  const updateChannelSettings = useCallback<DataStoreValue["updateChannelSettings"]>((patch) => {
    setChannelSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const sendReferralEmail = useCallback<DataStoreValue["sendReferralEmail"]>((id) => {
    // Mark pending immediately so the UI reflects the in-flight attempt.
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, referralEmailStatus: "pending" } : n)))
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // Simulate delivery (~10% transient failure). Failure never loses the
        // referral record — only the email status is flagged for resend.
        const success = Math.random() > 0.1
        setNotices((prev) =>
          prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  referralEmailStatus: success ? "sent" : "failed",
                  referralEmailSentAt: success ? new Date().toISOString() : n.referralEmailSentAt,
                }
              : n,
          ),
        )
        resolve(success)
      }, 1200)
    })
  }, [])

  const combined = useMemo(() => [...outbox, ...notices], [outbox, notices])
  // Keep a ref of the latest combined list so token lookups stay current without
  // forcing findByToken to change identity on every data mutation.
  combinedRef.current = combined

  const value = useMemo<DataStoreValue>(
    () => ({
      notices,
      outbox,
      combined,
      accounts,
      channelSettings,
      ready,
      issueNotice,
      resolveCase,
      updateCaseStatus,
      retryDelivery,
      sendReferralEmail,
      syncOutbox,
      findByToken,
      recordView,
      acknowledgeReferral,
      updateTrackingStatus,
      addAccount,
      updateAccount,
      toggleAccountActive,
      updateChannelSettings,
    }),
    [
      notices,
      outbox,
      combined,
      accounts,
      channelSettings,
      ready,
      issueNotice,
      resolveCase,
      updateCaseStatus,
      retryDelivery,
      sendReferralEmail,
      syncOutbox,
      findByToken,
      recordView,
      acknowledgeReferral,
      updateTrackingStatus,
      addAccount,
      updateAccount,
      toggleAccountActive,
      updateChannelSettings,
    ],
  )

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext)
  if (!ctx) throw new Error("useDataStore must be used within a DataStoreProvider")
  return ctx
}

/** District-scoping: staff see only their district; admins see everything. */
export function scopeNotices(list: NoticeRecord[], account: UserAccount | null): NoticeRecord[] {
  if (!account || account.role === "systems-admin" || account.district === ALL_DISTRICTS) return list
  return list.filter((n) => n.office === account.district)
}

/** Hook returning the notices visible to the current session (already district-scoped). */
export function useScopedNotices() {
  const { combined } = useDataStore()
  const { account } = useSession()
  return useMemo(() => scopeNotices(combined, account), [combined, account])
}
