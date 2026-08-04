"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn, ShieldCheck, UserRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"

type Role = "officer" | "admin"

export function LoginForm() {
  const router = useRouter()
  const [role, setRole] = useState<Role>("officer")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error("Enter your email and password to continue.")
      return
    }
    setPending(true)
    // Prototype sign-in: no backend, route straight into the system.
    setTimeout(() => {
      toast.success(`Signed in as ${role === "admin" ? "Administrator" : "Registration Officer"}`)
      router.push("/")
    }, 900)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <ToggleGroup
        value={[role]}
        onValueChange={(v) => {
          const next = v[0] as Role | undefined
          if (next) setRole(next)
        }}
        className="grid w-full grid-cols-2"
        aria-label="Select account type"
      >
        <ToggleGroupItem value="officer" className="gap-2">
          <UserRound data-icon="inline-start" />
          Officer
        </ToggleGroupItem>
        <ToggleGroupItem value="admin" className="gap-2">
          <ShieldCheck data-icon="inline-start" />
          Administrator
        </ToggleGroupItem>
      </ToggleGroup>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Work email</FieldLabel>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="name@nira.go.ug"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
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

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox id="remember" defaultChecked />
            Keep me signed in
          </label>
          <button
            type="button"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => toast.info("Contact your system administrator to reset your password.")}
          >
            Forgot password?
          </button>
        </div>

        <Field>
          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {pending ? <Spinner data-icon="inline-start" /> : <LogIn data-icon="inline-start" />}
            {pending ? "Signing in\u2026" : "Sign in"}
          </Button>
          <FieldDescription className="text-center">
            Prototype access — any email and password will sign you in.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
