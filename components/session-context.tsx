"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  ACCOUNTS_STORAGE_KEY,
  SEED_ACCOUNTS,
  authenticate,
  withAuthDefaults,
  type AuthResult,
  type UserAccount,
  type Role,
} from "@/lib/nira"

const STORAGE_KEY = "nira.session"

/** Read the managed roster straight from storage (login happens before the data store mounts). */
function loadAccounts(): UserAccount[] {
  if (typeof window === "undefined") return SEED_ACCOUNTS
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    const list = raw ? (JSON.parse(raw) as UserAccount[]) : SEED_ACCOUNTS
    return list.map(withAuthDefaults)
  } catch {
    return SEED_ACCOUNTS.map(withAuthDefaults)
  }
}

/** Persist a password change back into the shared roster so it survives reload / reaches the data store. */
function persistAccountPassword(id: string, password: string) {
  if (typeof window === "undefined") return
  try {
    const list = loadAccounts()
    const next = list.map((a) => (a.id === id ? { ...a, password, mustChangePassword: false } : a))
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore quota / privacy-mode errors
  }
}

interface SessionContextValue {
  account: UserAccount | null
  ready: boolean
  isAdmin: boolean
  role: Role | null
  district: string | null
  mustChangePassword: boolean
  signInWithCredentials: (email: string, password: string) => AuthResult
  changePassword: (newPassword: string) => void
  signOut: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setAccount(withAuthDefaults(JSON.parse(raw) as UserAccount))
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

  const signInWithCredentials = useCallback<SessionContextValue["signInWithCredentials"]>(
    (email, password) => {
      const result = authenticate(loadAccounts(), email, password)
      if (result.ok) signIn(result.account)
      return result
    },
    [signIn],
  )

  const changePassword = useCallback<SessionContextValue["changePassword"]>((newPassword) => {
    setAccount((prev) => {
      if (!prev) return prev
      const updated: UserAccount = { ...prev, password: newPassword, mustChangePassword: false }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      persistAccountPassword(updated.id, newPassword)
      return updated
    })
  }, [])

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
      mustChangePassword: Boolean(account?.mustChangePassword),
      signInWithCredentials,
      changePassword,
      signOut,
    }),
    [account, ready, signInWithCredentials, changePassword, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used within a SessionProvider")
  return ctx
}
