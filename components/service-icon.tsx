import {
  IdCard,
  RefreshCw,
  PackageCheck,
  ShieldAlert,
  PencilLine,
  Baby,
  Cross,
  BadgeCheck,
  FileCheck,
  Sparkles,
  Truck,
  Ellipsis,
  FileText,
  type LucideIcon,
} from "lucide-react"

const ICONS: Record<string, LucideIcon> = {
  "id-card": IdCard,
  "refresh-cw": RefreshCw,
  "package-check": PackageCheck,
  "shield-alert": ShieldAlert,
  "pencil-line": PencilLine,
  baby: Baby,
  cross: Cross,
  "badge-check": BadgeCheck,
  "file-check": FileCheck,
  sparkles: Sparkles,
  truck: Truck,
  ellipsis: Ellipsis,
}

export function ServiceIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = ICONS[name] ?? FileText
  return <Icon className={className} aria-hidden="true" />
}
