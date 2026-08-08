"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  ALL_DISTRICTS,
  DEFAULT_CHANNEL_SETTINGS,
  SEED_ACCOUNTS,
  type CaseStatus,
  type DeliveryChannelSettings,
  type NoticeRecord,
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
  syncOutbox: () => number
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
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [channelSettings, setChannelSettings] = useState<DeliveryChannelSettings>(DEFAULT_CHANNEL_SETTINGS)
  const [ready, setReady] = useState(false)

  // Hydrate from localStorage once.
  useEffect(() => {
    setNotices(load<NoticeRecord[]>(NOTICES_KEY, MOCK_NOTICES.map((n) => ({ ...n, syncState: "synced" }))))
    setOutbox(load<NoticeRecord[]>(OUTBOX_KEY, []))
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

  const combined = useMemo(() => [...outbox, ...notices], [outbox, notices])

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
      syncOutbox,
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
      syncOutbox,
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
