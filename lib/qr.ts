import QRCode from "qrcode"

/**
 * Generate a QR code as a PNG data URL.
 *
 * Defaults are tuned so the code survives being screenshotted, photographed off
 * another phone screen, forwarded over WhatsApp, or printed: a generous quiet
 * zone (margin) and a high pixel resolution regardless of the on-screen render
 * size. Error-correction level "M" balances density against redundancy for the
 * short verification URLs we encode.
 */
export async function qrDataUrl(
  text: string,
  opts: { size?: number; margin?: number; errorCorrectionLevel?: "L" | "M" | "Q" | "H" } = {},
): Promise<string> {
  const { size = 1024, margin = 4, errorCorrectionLevel = "M" } = opts
  return QRCode.toDataURL(text, {
    errorCorrectionLevel,
    margin,
    width: size,
    color: { dark: "#0f1c33", light: "#ffffff" },
  })
}

/**
 * Build a clean, brandable "share card" image (PNG data URL) that an officer can
 * save or send to a client. Contains NIRA branding, the QR code, the notice
 * number, a minimal client name, the referral destination, and a short
 * instruction — never the client's NIN, phone, or application number.
 */
export async function buildShareCard(input: {
  verifyUrl: string
  noticeNumber: string
  clientName?: string
  destination?: string
}): Promise<string> {
  const W = 1080
  const H = 1500
  const navy = "#243b5f"
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")

  // Background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, W, H)

  // Header band
  ctx.fillStyle = navy
  ctx.fillRect(0, 0, W, 210)
  ctx.fillStyle = "#ffffff"
  ctx.textAlign = "center"
  ctx.font = "bold 52px Arial, sans-serif"
  ctx.fillText("NIRA", W / 2, 90)
  ctx.font = "600 30px Arial, sans-serif"
  ctx.fillText("Client Services Outcome Notice", W / 2, 140)
  ctx.font = "400 24px Arial, sans-serif"
  ctx.fillText("Republic of Uganda", W / 2, 180)

  // QR code (centered)
  const qr = await qrDataUrl(input.verifyUrl, { size: 720, margin: 2 })
  const img = await loadImage(qr)
  const qrSize = 720
  const qrX = (W - qrSize) / 2
  const qrY = 290
  // Subtle border/quiet-zone frame around the QR
  ctx.strokeStyle = "#e2e6ec"
  ctx.lineWidth = 2
  ctx.strokeRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24)
  ctx.drawImage(img, qrX, qrY, qrSize, qrSize)

  // Notice number
  let y = qrY + qrSize + 80
  ctx.fillStyle = navy
  ctx.font = "bold 46px 'Courier New', monospace"
  ctx.fillText(input.noticeNumber, W / 2, y)

  // Minimal client name
  if (input.clientName) {
    y += 60
    ctx.fillStyle = "#33404f"
    ctx.font = "500 34px Arial, sans-serif"
    ctx.fillText(input.clientName, W / 2, y)
  }

  // Referral destination
  if (input.destination) {
    y += 54
    ctx.fillStyle = "#5b6672"
    ctx.font = "400 30px Arial, sans-serif"
    wrapText(ctx, input.destination, W / 2, y, W - 160, 40)
    y += 40
  }

  // Instruction
  y += 70
  ctx.fillStyle = navy
  ctx.font = "600 30px Arial, sans-serif"
  wrapText(
    ctx,
    "Present this QR code at the NIRA office you have been referred to.",
    W / 2,
    y,
    W - 160,
    42,
  )

  return canvas.toDataURL("image/png")
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Draw center-aligned text that wraps within maxWidth; returns the next y. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ")
  let line = ""
  let curY = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY)
      line = word
      curY += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, curY)
  return curY
}
