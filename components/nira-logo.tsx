import Image from "next/image"
import { cn } from "@/lib/utils"

// NIRA fingerprint emblem (Uganda flag colors on a black disc).
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
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full",
        variant === "light" ? "bg-background ring-2 ring-background/80" : "bg-background ring-1 ring-border",
        className,
      )}
    >
      <Image
        src="/nira-emblem.png"
        alt="NIRA emblem"
        fill
        sizes="48px"
        className="object-contain p-0.5"
        priority
      />
    </div>
  )
}
