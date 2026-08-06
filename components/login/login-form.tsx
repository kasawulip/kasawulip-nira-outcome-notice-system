"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn, UserRound } from "lucide-react"
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
import { Spinner } from "@/components/ui/spinner"

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error("Enter your username and password to continue.")
      return
    }
    setPending(true)
    // Prototype sign-in: no backend. Usernames containing "admin" get the
    // administrator workspace; everyone else gets the officer workspace.
    const role = /admin/i.test(username.trim()) ? "admin" : "officer"
    if (typeof window !== "undefined") window.localStorage.setItem("nira-role", role)
    setTimeout(() => {
      toast.success(role === "admin" ? "Signed in as administrator" : "Signed in successfully")
      router.push("/")
    }, 900)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="username"
              autoComplete="username"
              placeholder="Enter your username"
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
          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {pending ? <Spinner data-icon="inline-start" /> : <LogIn data-icon="inline-start" />}
            {pending ? "Signing in\u2026" : "Sign in"}
          </Button>
          <FieldDescription className="text-center">
            Prototype access — sign in with any password. Use a username containing
            &ldquo;admin&rdquo; for the administrator workspace.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
