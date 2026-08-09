"use client"

import { useState } from "react"
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { NiraLogo } from "@/components/nira-logo"
import { useSession } from "@/components/session-context"
import { DEFAULT_PASSWORD } from "@/lib/nira"

const MIN_LENGTH = 8

export function ForcePasswordChange() {
  const { account, changePassword, signOut } = useSession()
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [pending, setPending] = useState(false)

  const tooShort = next.length > 0 && next.length < MIN_LENGTH
  const isDefault = next === DEFAULT_PASSWORD
  const mismatch = confirm.length > 0 && confirm !== next
  const valid = next.length >= MIN_LENGTH && !isDefault && next === confirm

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    if (!valid) {
      toast.error(
        isDefault
          ? "Choose a password different from the default."
          : tooShort
            ? `Use at least ${MIN_LENGTH} characters.`
            : "Passwords do not match.",
      )
      return
    }
    setPending(true)
    setTimeout(() => {
      changePassword(next)
      toast.success("Password updated. You're all set.")
      // No navigation needed — clearing mustChangePassword re-renders the app.
    }, 500)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-4">
          <NiraLogo />
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <h1 className="font-serif text-2xl font-semibold text-foreground">Set a new password</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {account ? `Welcome, ${account.name.split(" ")[0]}. ` : ""}
            For your security, please replace the default password before continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="new-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  aria-invalid={tooShort || isDefault}
                />
                <InputGroupAddon>
                  <KeyRound />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow((s) => !s)}
                  >
                    {show ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {isDefault ? (
                <FieldDescription className="text-destructive">
                  Choose a password different from the default.
                </FieldDescription>
              ) : tooShort ? (
                <FieldDescription className="text-destructive">Use at least {MIN_LENGTH} characters.</FieldDescription>
              ) : (
                <FieldDescription>Use at least {MIN_LENGTH} characters, not the default password.</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="confirm-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={mismatch}
                />
                <InputGroupAddon>
                  <KeyRound />
                </InputGroupAddon>
              </InputGroup>
              {mismatch ? (
                <FieldDescription className="text-destructive">Passwords do not match.</FieldDescription>
              ) : null}
            </Field>

            <Field>
              <Button type="submit" size="lg" disabled={pending || !valid} className="h-12 w-full text-base">
                {pending ? "Saving\u2026" : "Save password & continue"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={signOut} className="w-full">
                Sign out instead
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </main>
  )
}
