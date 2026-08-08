"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn, UserRound, ShieldCheck, MapPin } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useSession } from "@/components/session-context"
import { DEMO_ACCOUNTS, ROLE_LABEL } from "@/lib/nira"

type RoleKey = "staff" | "admin"

const ROLE_OPTIONS: {
  key: RoleKey
  icon: typeof UserRound
  title: string
  detail: string
}[] = [
  {
    key: "staff",
    icon: MapPin,
    title: ROLE_LABEL["district-staff"],
    detail: `${DEMO_ACCOUNTS.staff.district}`,
  },
  {
    key: "admin",
    icon: ShieldCheck,
    title: ROLE_LABEL["systems-admin"],
    detail: "All districts \u00b7 national",
  },
]

export function LoginForm() {
  const router = useRouter()
  const { signInDemo } = useSession()
  const [role, setRole] = useState<RoleKey>("staff")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState<RoleKey | null>(null)

  function enter(as: RoleKey) {
    setPending(as)
    setTimeout(() => {
      signInDemo(as)
      toast.success(`Signed in as ${ROLE_LABEL[as === "staff" ? "district-staff" : "systems-admin"]}`)
      router.push("/")
    }, 700)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    enter(role)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium text-foreground">Sign in as</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROLE_OPTIONS.map((opt) => {
            const active = role === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRole(opt.key)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-[76px] flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-accent ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <opt.icon className="size-4" />
                </span>
                <span className="text-sm font-semibold text-foreground">{opt.title}</span>
                <span className="text-xs text-muted-foreground">{opt.detail}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="username"
              autoComplete="username"
              placeholder="Optional for prototype"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <InputGroupAddon>
              <UserRound />
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Optional for prototype"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Field>
          <Button type="submit" size="lg" disabled={pending !== null} className="h-12 w-full text-base">
            {pending ? <Spinner data-icon="inline-start" /> : <LogIn data-icon="inline-start" />}
            {pending ? "Signing in\u2026" : `Continue as ${role === "staff" ? "District Staff" : "Systems Admin"}`}
          </Button>
          <FieldDescription className="text-center">
            Prototype access — pick a role above; credentials are optional.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
