"use client"

import { Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const SHORTCUTS = [
  { keys: "Alt + N", desc: "New notice" },
  { keys: "Alt + 1", desc: "First Registration" },
  { keys: "Alt + 2", desc: "Renewal" },
  { keys: "Alt + 3", desc: "ID Collection" },
  { keys: "Alt + I", desc: "Issue notice" },
  { keys: "Esc", desc: "Close preview" },
]

export function ShortcutsHelp() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Keyboard data-icon="inline-start" />
            <span className="hidden sm:inline">Shortcuts</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64">
        <p className="mb-2 text-sm font-semibold">Keyboard shortcuts</p>
        <ul className="flex flex-col gap-1.5">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{s.desc}</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
