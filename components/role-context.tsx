"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { CURRENT_OFFICER, CURRENT_ADMIN } from "@/lib/nira"

export type Role = "officer" | "admin"

export interface CurrentUser {
  name: string
  title: string
  office: string
  initials: string
  role: Role
}

interface RoleContextValue {
  role: Role
  user: CurrentUser
  setRole: (role: Role) => void
  mounted: boolean
}

const STORAGE_KEY = "nira-role"

const RoleContext = createContext<RoleContextValue | null>(null)

function userForRole(role: Role): CurrentUser {
  return role === "admin"
    ? { ...CURRENT_ADMIN, role }
    : { ...CURRENT_OFFICER, role }
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("officer")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
    if (saved === "admin" || saved === "officer") setRoleState(saved)
    setMounted(true)
  }, [])

  function setRole(next: Role) {
    setRoleState(next)
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next)
  }

  return (
    <RoleContext.Provider value={{ role, user: userForRole(role), setRole, mounted }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used within a RoleProvider")
  return ctx
}
