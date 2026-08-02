"use client"

import { createContext, useContext, useState } from "react"

export type NetworkState = "online" | "weak" | "offline"

interface NetworkContextValue {
  status: NetworkState
  setStatus: (s: NetworkState) => void
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<NetworkState>("online")
  return (
    <NetworkContext.Provider value={{ status, setStatus }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider")
  return ctx
}
