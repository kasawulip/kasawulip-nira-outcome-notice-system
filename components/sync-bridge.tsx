"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useNetwork } from "@/components/network-context"
import { useDataStore } from "@/components/data-store-context"

/**
 * Bridges connectivity <-> data store: when the app comes back online and there
 * are queued notices in the outbox, flush them and confirm asynchronously.
 */
export function SyncBridge() {
  const { isOnline } = useNetwork()
  const { outbox, syncOutbox, ready } = useDataStore()
  const wasOnline = useRef(isOnline)

  useEffect(() => {
    if (!ready) return
    const cameOnline = isOnline && !wasOnline.current
    wasOnline.current = isOnline
    if ((cameOnline || isOnline) && outbox.length > 0) {
      // small delay so the reconnection feels asynchronous, not instant
      const t = setTimeout(() => {
        const moved = syncOutbox()
        if (moved > 0) {
          toast.success(`${moved} queued ${moved === 1 ? "notice" : "notices"} synced`, {
            description: "Delivery is being confirmed in the background.",
          })
        }
      }, 900)
      return () => clearTimeout(t)
    }
  }, [isOnline, outbox.length, ready, syncOutbox])

  return null
}
