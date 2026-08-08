"use client"

import { useEffect, useState } from "react"
import { qrDataUrl } from "@/lib/qr"
import { cn } from "@/lib/utils"

/**
 * Renders a real QR code for `value` as an <img>. High resolution + quiet zone
 * so it stays scannable from a screenshot, photo of a screen, or printout.
 */
export function QRCode({
  value,
  size = 200,
  className,
  errorCorrectionLevel = "M",
}: {
  value: string
  size?: number
  className?: string
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
}) {
  const [src, setSrc] = useState<string>("")

  useEffect(() => {
    let active = true
    // Render at 2x for crisp display / capture, downscaled by CSS.
    qrDataUrl(value, { size: Math.max(512, size * 2), margin: 3, errorCorrectionLevel })
      .then((url) => {
        if (active) setSrc(url)
      })
      .catch(() => {
        if (active) setSrc("")
      })
    return () => {
      active = false
    }
  }, [value, size, errorCorrectionLevel])

  return (
    <div
      className={cn("flex items-center justify-center rounded-lg bg-white p-2", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src || "/placeholder.svg"}
          alt="QR code to retrieve this notice"
          width={size}
          height={size}
          className="h-full w-full"
        />
      ) : (
        <span className="text-[10px] text-muted-foreground">Generating…</span>
      )}
    </div>
  )
}
