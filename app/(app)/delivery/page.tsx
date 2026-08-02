import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { DeliveryMonitor } from "@/components/delivery/delivery-monitor"

export const metadata: Metadata = {
  title: "Delivery Status | NIRA Outcome Notices",
}

export default function DeliveryPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Delivery Status"
        description="Monitor SMS and email delivery of issued outcome notices in real time."
      />
      <DeliveryMonitor />
    </div>
  )
}
