import { NetworkProvider } from "@/components/network-context"
import { DataStoreProvider } from "@/components/data-store-context"
import { AppShell } from "@/components/app-shell"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NetworkProvider>
      <DataStoreProvider>
        <AppShell>{children}</AppShell>
      </DataStoreProvider>
    </NetworkProvider>
  )
}
