"use client"

import { useRouter } from "next/navigation"
import { Building2, Wifi, WifiOff, SignalMedium, ChevronDown, LogOut, Check, RefreshCw, CloudOff } from "lucide-react"

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
import { ROLE_LABEL } from "@/lib/nira"
import { useNetwork, type NetworkState, type NetworkOverride } from "@/components/network-context"
import { useSession } from "@/components/session-context"
import { useDataStore } from "@/components/data-store-context"

const NET_META: Record<NetworkState, { label: string; icon: typeof Wifi; dot: string; text: string }> = {
  online: { label: "Online", icon: Wifi, dot: "bg-success", text: "text-success" },
  weak: { label: "Weak connection", icon: SignalMedium, dot: "bg-warning", text: "text-warning-foreground" },
  offline: { label: "Offline", icon: WifiOff, dot: "bg-destructive", text: "text-destructive" },
}

const OVERRIDE_OPTIONS: { key: NetworkOverride; label: string; icon: typeof Wifi }[] = [
  { key: "auto", label: "Auto (follow device)", icon: RefreshCw },
  { key: "online", label: "Online", icon: Wifi },
  { key: "weak", label: "Weak connection", icon: SignalMedium },
  { key: "offline", label: "Offline", icon: WifiOff },
]

export function AppHeader() {
  const router = useRouter()
  const { status, override, setOverride } = useNetwork()
  const { account, role, signOut } = useSession()
  const { outbox, syncOutbox } = useDataStore()
  const meta = NET_META[status]
  const NetIcon = meta.icon
  const queued = outbox.length

  function handleSignOut() {
    signOut()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card px-3 md:px-4">
      <SidebarTrigger className="hidden text-foreground md:flex" />
      <Separator orientation="vertical" className="mr-1 hidden h-6 md:block" />

      <div className="flex items-center gap-2 md:hidden">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            {account?.initials ?? "NA"}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex min-w-0 flex-col leading-tight">
        <h1 className="truncate text-sm font-semibold text-foreground">
          <span className="hidden sm:inline">Client Services Outcome Notices</span>
          <span className="sm:hidden">Outcome Notices</span>
        </h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3" aria-hidden="true" />
          <span className="truncate">{account?.district}</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Offline queue pill */}
        {queued > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-warning/50 text-warning-foreground"
            onClick={() => syncOutbox()}
          >
            <CloudOff className="size-4" />
            <span className="hidden sm:inline">{queued} queued</span>
            <span className="sm:hidden">{queued}</span>
          </Button>
        ) : null}

        {/* Connectivity */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="gap-1.5" aria-label={`Connection: ${meta.label}`}>
                <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden="true" />
                <NetIcon className={cn("size-4", meta.text)} data-icon="inline-start" />
                <span className="hidden md:inline">{meta.label}</span>
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Connection (demo control)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {OVERRIDE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <DropdownMenuItem key={opt.key} onClick={() => setOverride(opt.key)}>
                    <Icon className="size-4" />
                    <span>{opt.label}</span>
                    {override === opt.key ? <Check className="ml-auto size-4" /> : null}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="gap-2 pl-1.5">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {account?.initials ?? "NA"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left leading-tight lg:flex lg:flex-col">
                  <span className="text-xs font-medium">{account?.name}</span>
                  <span className="text-[11px] text-muted-foreground">{role ? ROLE_LABEL[role] : ""}</span>
                </span>
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span>{account?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {role ? ROLE_LABEL[role] : ""} · {account?.district}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
