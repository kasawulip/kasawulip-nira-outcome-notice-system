import { DataStoreProvider } from "@/components/data-store-context"

// Public retrieval route. Deliberately OUTSIDE the (app) group so it renders
// without the authenticated app shell — a receiving officer can scan the QR and
// verify a notice exists without logging in. The data store is still provided so
// the page can look up the notice by its secure token and record a view.
export default function PublicNoticeLayout({ children }: { children: React.ReactNode }) {
  return <DataStoreProvider>{children}</DataStoreProvider>
}
