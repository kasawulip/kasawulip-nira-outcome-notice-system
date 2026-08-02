import { cn } from "@/lib/utils"

// Placeholder for the official NIRA logo/emblem.
export function NiraLogo({
  className,
  variant = "light",
}: {
  className?: string
  variant?: "light" | "dark"
}) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md border font-serif text-sm font-bold tracking-tight",
        variant === "light"
          ? "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground"
          : "border-primary/20 bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      NIRA
    </div>
  )
}
