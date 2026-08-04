import type { Metadata } from "next"
import { ShieldCheck, FileCheck2, Clock } from "lucide-react"

import { NiraLogo } from "@/components/nira-logo"
import { LoginForm } from "@/components/login/login-form"

export const metadata: Metadata = {
  title: "Sign in | NIRA Client Services Outcome Notice System",
  description: "Secure staff sign-in for the NIRA Client Services Outcome Notice System.",
}

const highlights = [
  {
    icon: FileCheck2,
    title: "Issue notices in seconds",
    description: "Record service outcomes and hand clients a clear next step before they leave the desk.",
  },
  {
    icon: Clock,
    title: "Track every case",
    description: "Follow delivery status and outstanding actions across all district offices.",
  },
  {
    icon: ShieldCheck,
    title: "Accountable by design",
    description: "Every notice is logged with a full audit trail and officer attribution.",
  },
]

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background lg:flex-row">
      {/* Brand panel */}
      <section className="relative flex flex-col justify-between gap-10 bg-sidebar px-6 py-8 text-sidebar-foreground lg:w-[46%] lg:px-12 lg:py-12">
        <div className="flex items-center gap-3">
          <NiraLogo variant="light" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-sidebar-primary-foreground">NIRA</p>
            <p className="text-xs text-sidebar-foreground/70">National Identification &amp; Registration Authority</p>
          </div>
        </div>

        <div className="hidden flex-col gap-8 lg:flex">
          <div className="flex flex-col gap-3">
            <h1 className="text-balance font-serif text-3xl font-semibold text-sidebar-primary-foreground">
              Client Services Outcome Notice System
            </h1>
            <p className="max-w-md text-pretty text-sm leading-relaxed text-sidebar-foreground/80">
              The internal service-desk tool for issuing outcome notices when a requested service cannot be completed
              during a client visit.
            </p>
          </div>

          <ul className="flex flex-col gap-5">
            {highlights.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-primary">
                  <item.icon className="size-4" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-sidebar-primary-foreground">{item.title}</p>
                  <p className="text-xs leading-relaxed text-sidebar-foreground/70">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/60">
          Authorized use only. Activity on this system is monitored and recorded.
        </p>
      </section>

      {/* Form panel */}
      <section className="flex flex-1 items-center justify-center px-6 py-10 lg:px-12">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Sign in to your account</h2>
            <p className="text-sm text-muted-foreground">
              Enter your NIRA staff credentials to access the notice system.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
