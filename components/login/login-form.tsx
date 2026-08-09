"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn, Mail } from "lucide-react"
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
import { useSession } from "@/components/session-context"

const REASON_MESSAGE: Record<string, string> = {
  "not-found": "No account found for that email address.",
  "bad-password": "Incorrect password. Please try again.",
  inactive: "This account has been disabled. Contact your administrator.",
}

export function LoginForm() {
  const router = useRouter()
  const { signInWithCredentials } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    if (!email.trim() || !password) {
      toast.error("Enter your email and password")
      return
    }
    setPending(true)
    // Small delay to mimic a network round-trip and show the spinner.
    setTimeout(() => {
      const result = signInWithCredentials(email, password)
      if (!result.ok) {
        setPending(false)
        toast.error(REASON_MESSAGE[result.reason] ?? "Unable to sign in.")
        return
      }
      if (result.account.mustChangePassword) {
        toast.info("Please set a new password to finish signing in.")
      } else {
        toast.success(`Welcome back, ${result.account.name.split(" ")[0]}`)
      }
      router.push("/")
    }, 600)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="name@nira.go.ug"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputGroupAddon>
              <Mail />
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

        <Field>
          <Button type="submit" size="lg" disabled={pending} className="h-12 w-full text-base">
            {pending ? <Spinner data-icon="inline-start" /> : <LogIn data-icon="inline-start" />}
            {pending ? "Signing in\u2026" : "Sign in"}
          </Button>
          <FieldDescription className="text-center">
            First-time sign-in uses the default password{" "}
            <span className="font-medium text-foreground">Welcome123</span>. You&apos;ll be prompted to change it.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
