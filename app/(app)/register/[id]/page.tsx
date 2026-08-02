import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NoticeDetail } from "@/components/register/notice-detail"
import { MOCK_NOTICES } from "@/lib/mock-notices"

export function generateStaticParams() {
  return MOCK_NOTICES.map((n) => ({ id: n.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const notice = MOCK_NOTICES.find((n) => n.id === id)
  return {
    title: notice ? `${notice.clientName} · ${notice.noticeNumber} | NIRA` : "Notice | NIRA",
  }
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const notice = MOCK_NOTICES.find((n) => n.id === id)
  if (!notice) notFound()
  return <NoticeDetail notice={notice} />
}
