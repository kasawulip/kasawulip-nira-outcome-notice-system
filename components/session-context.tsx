"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { DEMO_ACCOUNTS, type UserAccount, type Role } from "@/lib/nira"

const STORAGE_KEY = "nira.session"

interface SessionContextValue {
  account: UserAccount | null
  ready: boolean
  isAdmin: boolean
  role: Role | null
  district: string | null
  signIn: (account: UserAccount) => void
  signInDemo: (key: "staff" | "admin") => void
  signOut: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setAccount(JSON.parse(raw) as UserAccount)
    } catch {
      // ignore corrupt storage
    }
    setReady(true)
  }, [])

  const signIn = useCallback((next: UserAccount) => {
    setAccount(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }, [])

  const signInDemo = useCallback(
    (key: "staff" | "admin") => {
      signIn(DEMO_ACCOUNTS[key])
    },
    [signIn],
  )

  const signOut = useCallback(() => {
    setAccount(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      account,
      ready,
      isAdmin: account?.role === "systems-admin",
      role: account?.role ?? null,
      district: account?.district ?? null,
      signIn,
      signInDemo,
      signOut,
    }),
    [account, ready, signIn, signInDemo, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used within a SessionProvider")
  return ctx
}
