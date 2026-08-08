"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Route-level error boundary. Catches rendering errors within the app so a
 * single failing screen degrades gracefully instead of crashing the whole
 * interface. Deliberately shows a plain, user-safe message — never a stack
 * trace, raw error text, or internal details — and offers a retry.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log for diagnostics only; nothing sensitive is surfaced to the user.
    console.error("[v0] Route render error:", error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-muted/40 p-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="max-w-sm text-pretty text-sm text-muted-foreground">
          This screen ran into an unexpected problem. Your saved notices are unaffected. Try again, and if the
          problem persists, reload the page.
        </p>
        {error.digest ? (
          <p className="mt-1 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
        ) : null}
      </div>
      <Button onClick={reset}>
        <RotateCcw data-icon="inline-start" />
        Try again
      </Button>
    </div>
  )
}
