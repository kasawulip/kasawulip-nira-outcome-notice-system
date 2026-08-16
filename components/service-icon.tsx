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
import { serviceIcon, type ServiceId } from "@/lib/nira"

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
  service,
  className,
}: {
  /** Direct lucide icon key. */
  name?: string
  /** Service id — the icon key is resolved automatically. */
  service?: ServiceId
  className?: string
}) {
  const key = name ?? (service ? serviceIcon(service) : undefined)
  const Icon = (key && ICONS[key]) || FileText
  return <Icon className={className} aria-hidden="true" />
}
