"use client"

import { Building2, Bell, Wifi, WifiOff, SignalMedium, ChevronDown, User, Check } from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { CURRENT_OFFICER } from "@/lib/nira"
import { useNetwork, type NetworkState } from "@/components/network-context"

const NET_META: Record<NetworkState, { label: string; icon: typeof Wifi; dot: string; text: string }> = {
  online: { label: "Online", icon: Wifi, dot: "bg-success", text: "text-success" },
  weak: { label: "Weak connection", icon: SignalMedium, dot: "bg-warning", text: "text-warning-foreground" },
  offline: { label: "Offline", icon: WifiOff, dot: "bg-destructive", text: "text-destructive" },
}

const NOTIFICATIONS = [
  { title: "SMS delivery failed", body: "Notice NIRA-MAK-20260802-00... to Amina Namusoke", tone: "error" },
  { title: "Case overdue", body: "Esther Auma — expected completion passed", tone: "warning" },
  { title: "Card batch received", body: "12 National ID cards available for collection", tone: "info" },
]

export function AppHeader() {
  const { status, setStatus } = useNetwork()
  const meta = NET_META[status]
  const NetIcon = meta.icon

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card px-3 md:px-4">
      <SidebarTrigger className="text-foreground" />
      <Separator orientation="vertical" className="mr-1 hidden h-6 md:block" />

      <div className="flex min-w-0 flex-col leading-tight">
        <h1 className="truncate text-sm font-semibold text-foreground">
          Client Services Outcome Notice System
        </h1>
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <Building2 className="size-3" aria-hidden="true" />
          <span>{CURRENT_OFFICER.office}</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Network status (demonstrable) */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="gap-1.5">
                <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden="true" />
                <NetIcon className={cn("size-4", meta.text)} data-icon="inline-start" />
                <span className="hidden sm:inline">{meta.label}</span>
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Connection (demo)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {(Object.keys(NET_META) as NetworkState[]).map((key) => {
                const m = NET_META[key]
                const Icon = m.icon
                return (
                  <DropdownMenuItem key={key} onClick={() => setStatus(key)}>
                    <Icon className="size-4" />
                    <span>{m.label}</span>
                    {status === key ? <Check className="ml-auto size-4" /> : null}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="size-4" />
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" aria-hidden="true" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NOTIFICATIONS.map((n) => (
              <DropdownMenuItem key={n.title} className="flex-col items-start gap-0.5 py-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      n.tone === "error" ? "bg-destructive" : n.tone === "warning" ? "bg-warning" : "bg-primary",
                    )}
                    aria-hidden="true"
                  />
                  {n.title}
                </span>
                <span className="pl-3.5 text-xs text-muted-foreground">{n.body}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Officer profile */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="gap-2 pl-1.5">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {CURRENT_OFFICER.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left leading-tight lg:flex lg:flex-col">
                  <span className="text-xs font-medium">{CURRENT_OFFICER.name}</span>
                  <span className="text-[11px] text-muted-foreground">{CURRENT_OFFICER.title}</span>
                </span>
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span>{CURRENT_OFFICER.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{CURRENT_OFFICER.office}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4" />
              My profile
            </DropdownMenuItem>
            <DropdownMenuItem>Switch office</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
