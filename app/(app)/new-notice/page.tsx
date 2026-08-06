import type { Metadata } from "next"
import { NoticeForm } from "@/components/new-notice/notice-form"

export const metadata: Metadata = {
  title: "New Notice | NIRA Client Services",
  description: "Issue a client services outcome notice at the service window.",
}

export default function NewNoticePage() {
  return <NoticeForm />
}
