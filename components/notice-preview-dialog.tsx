"use client"

import { Printer, Download, X } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { NoticePreview, type PreviewData } from "@/components/notice-preview"

export function NoticePreviewDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: PreviewData | null
}) {
  if (!data) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogHeader className="no-print flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
          <DialogTitle className="text-sm">Notice preview — {data.noticeNumber}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer data-icon="inline-start" />
              Print
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success("PDF download simulated", { description: `${data.noticeNumber}.pdf` })}
            >
              <Download data-icon="inline-start" />
              Download PDF
            </Button>
            <DialogClose
              render={
                <Button size="icon-sm" variant="ghost" aria-label="Close preview">
                  <X />
                </Button>
              }
            />
          </div>
        </DialogHeader>
        <div className="overflow-y-auto bg-muted/40 p-4">
          <div className="print-area">
            <NoticePreview data={data} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
