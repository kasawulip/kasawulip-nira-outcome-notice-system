"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { NoticeDetail } from "@/components/register/notice-detail"
import { useScopedNotices } from "@/components/data-store-context"

export default function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const notices = useScopedNotices()
  const notice = notices.find((n) => n.id === id)

  if (!notice) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Link
          href="/register"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to register
        </Link>
        <Empty className="rounded-lg border border-border bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>Notice not found</EmptyTitle>
            <EmptyDescription>
              This notice does not exist, or it belongs to a district outside your access.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/register">Return to register</Link>
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <NoticeDetail notice={notice} />
    </div>
  )
}
