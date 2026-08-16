"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type NetworkState = "online" | "weak" | "offline"
export type NetworkOverride = "auto" | NetworkState

interface NetworkContextValue {
  /** Effective connectivity used across the app. */
  status: NetworkState
  /** True when notices can be sent immediately (online or weak). */
  isOnline: boolean
  /** True only when fully offline (queue mode). */
  isOffline: boolean
  /** Manual demo override; "auto" follows the real browser connectivity. */
  override: NetworkOverride
  setOverride: (o: NetworkOverride) => void
  /** Back-compat: set a concrete status (used by the header toggle). */
  setStatus: (s: NetworkState) => void
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [browserOnline, setBrowserOnline] = useState(true)
  const [override, setOverride] = useState<NetworkOverride>("auto")

  useEffect(() => {
    if (typeof navigator !== "undefined") setBrowserOnline(navigator.onLine)
    const on = () => setBrowserOnline(true)
    const off = () => setBrowserOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])

  const status: NetworkState = override === "auto" ? (browserOnline ? "online" : "offline") : override

  const value = useMemo<NetworkContextValue>(
    () => ({
      status,
      isOnline: status !== "offline",
      isOffline: status === "offline",
      override,
      setOverride,
      setStatus: (s: NetworkState) => setOverride(s),
    }),
    [status, override],
  )

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider")
  return ctx
}
