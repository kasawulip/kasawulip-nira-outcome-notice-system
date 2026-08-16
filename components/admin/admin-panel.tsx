"use client"

import { useMemo, useState } from "react"
import {
  Users,
  Building2,
  SlidersHorizontal,
  Plus,
  ShieldCheck,
  Activity,
  MessageSquare,
  Mail,
  Printer,
  CloudOff,
  CheckCircle2,
  AlertTriangle,
  Check,
  ChevronsUpDown,
  KeyRound,
} from "lucide-react"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatCard } from "@/components/stat-card"
import {
  DEFAULT_PASSWORD,
  ASSIGNABLE_OFFICES,
  DISTRICTS,
  HQ_DIRECTORATES,
  HQ_OFFICE_NAME,
  ROLE_LABEL,
  type Role,
  type UserAccount,
} from "@/lib/nira"
import { useDataStore } from "@/components/data-store-context"

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

const ROLE_TONE: Record<Role, "default" | "secondary" | "outline"> = {
  "systems-admin": "default",
  "district-staff": "secondary",
  "hq-staff": "outline",
}

function HealthCard({
  label,
  value,
  hint,
  tone,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  tone: "ok" | "warn" | "down"
  icon: typeof Activity
}) {
  const dot =
    tone === "ok" ? "bg-success" : tone === "warn" ? "bg-warning" : "bg-destructive"
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`size-2 shrink-0 rounded-full ${dot}`} />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <p className="mt-0.5 text-lg font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}

export function AdminPanel() {
  const {
    accounts,
    combined,
    outbox,
    channelSettings,
    addAccount,
    updateAccount,
    toggleAccountActive,
    updateChannelSettings,
  } = useDataStore()

  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState<Role>("district-staff")
  const [newDistrict, setNewDistrict] = useState<string>(DISTRICTS[0].name)
  const [newDepartment, setNewDepartment] = useState<string>("")
  const [newEmail, setNewEmail] = useState("")
  const [districtOpen, setDistrictOpen] = useState(false)
  const [districtQuery, setDistrictQuery] = useState("")
  const [resetTarget, setResetTarget] = useState<UserAccount | null>(null)

  // Search-first filtering so the assignable-office list stays compact and
  // never expands to cover the account form.
  const districtSearch = districtQuery.trim().toLowerCase()
  const districtMatches = useMemo(
    () =>
      districtSearch
        ? DISTRICTS.filter((d) => `${d.name} ${d.code}`.toLowerCase().includes(districtSearch))
        : DISTRICTS,
    [districtSearch],
  )

  // NIRA Hqtrs Staff are always attached to Headquarters and must additionally
  // be attached to a directorate/department.
  const isHqRole = newRole === "hq-staff"
  const requiresDepartment = isHqRole

  const admins = accounts.filter((a) => a.role === "systems-admin").length
  const staff = accounts.filter((a) => a.role === "district-staff" || a.role === "hq-staff").length
  const activeCount = accounts.filter((a) => a.active).length

  // System health, derived from live store data.
  const totalNotices = combined.length
  const failed = combined.filter((n) => n.smsStatus === "Failed" || n.emailStatus === "Failed").length
  const delivered = combined.filter((n) => n.smsStatus === "Delivered").length
  const sent = combined.filter((n) => n.smsStatus === "Delivered" || n.smsStatus === "Sent").length
  const deliveryRate = sent ? Math.round((delivered / sent) * 100) : 100
  const queued = outbox.length

  function addOfficer() {
    if (!newName.trim()) {
      toast.error("Enter the officer's full name")
      return
    }
    if (requiresDepartment && !newDepartment) {
      toast.error("Select the HQ directorate / department for this officer")
      return
    }
    const account: UserAccount = {
      id: `acc-${Date.now()}`,
      name: newName.trim(),
      title: newRole === "systems-admin" ? "Systems Administrator" : "Registration Officer",
      role: newRole,
      district:
        newRole === "systems-admin" ? "All Districts" : isHqRole ? HQ_OFFICE_NAME : newDistrict,
      department: requiresDepartment ? newDepartment : undefined,
      initials: initialsFor(newName.trim()),
      active: true,
      email: newEmail.trim() || undefined,
      // New accounts start on the shared default and must change it at first sign-in.
      password: DEFAULT_PASSWORD,
      mustChangePassword: true,
    }
    addAccount(account)
    setNewName("")
    setNewEmail("")
    setNewDepartment("")
    toast.success(`${account.name} added. Default password: ${DEFAULT_PASSWORD}`)
  }

  function confirmReset() {
    if (!resetTarget) return
    updateAccount(resetTarget.id, { password: DEFAULT_PASSWORD, mustChangePassword: true })
    toast.success(`Password for ${resetTarget.name} reset to ${DEFAULT_PASSWORD}`)
    setResetTarget(null)
  }

  const districtCounts = useMemo(() => {
    return ASSIGNABLE_OFFICES.map((d) => ({
      ...d,
      officers: accounts.filter((a) => a.district === d.name).length,
      notices: combined.filter((n) => n.office === d.name).length,
    }))
  }, [accounts, combined])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total accounts" value={accounts.length} icon={Users} />
        <StatCard label="Active" value={activeCount} icon={ShieldCheck} tone="success" />
        <StatCard label="District staff" value={staff} icon={Users} />
        <StatCard label="Administrators" value={admins} icon={ShieldCheck} />
      </div>

      <Tabs defaultValue="accounts">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="accounts">
            <Users data-icon="inline-start" />
            Accounts &amp; Districts
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity data-icon="inline-start" />
            System Health
          </TabsTrigger>
          <TabsTrigger value="channels">
            <SlidersHorizontal data-icon="inline-start" />
            Delivery Channels
          </TabsTrigger>
        </TabsList>

        {/* Accounts & district assignment */}
        <TabsContent value="accounts" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Officer accounts</CardTitle>
                  <CardDescription>
                    Manage who can issue notices and which district they are assigned to.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Officer</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="hidden md:table-cell">District</TableHead>
                        <TableHead className="pr-6 text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="pl-6">
                            <span className="font-medium text-foreground">{a.name}</span>
                            <span className="block text-xs text-muted-foreground">{a.title}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ROLE_TONE[a.role]}>{ROLE_LABEL[a.role]}</Badge>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">
                            {a.district}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => toggleAccountActive(a.id)}
                                className="inline-flex items-center gap-2 text-sm"
                                aria-label={`Toggle ${a.name} ${a.active ? "off" : "on"}`}
                              >
                                <span
                                  className={
                                    a.active
                                      ? "size-2 rounded-full bg-success"
                                      : "size-2 rounded-full bg-muted-foreground/40"
                                  }
                                />
                                <span className={a.active ? "text-foreground" : "text-muted-foreground"}>
                                  {a.active ? "Active" : "Disabled"}
                                </span>
                              </button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 px-2 text-muted-foreground"
                                onClick={() => setResetTarget(a)}
                              >
                                <KeyRound className="size-3.5" />
                                <span className="hidden sm:inline">Reset password</span>
                                <span className="sr-only sm:hidden">Reset password for {a.name}</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Districts</CardTitle>
                  <CardDescription>Field offices authorised to issue outcome notices.</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">District office</TableHead>
                        <TableHead>Officers</TableHead>
                        <TableHead className="pr-6 text-right">Notices</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {districtCounts.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="pl-6 font-medium text-foreground">{d.name}</TableCell>
                          <TableCell className="text-muted-foreground">{d.officers} assigned</TableCell>
                          <TableCell className="pr-6 text-right text-muted-foreground">{d.notices}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base">Add account</CardTitle>
                <CardDescription>Create a new officer or admin account.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="new-name">Full name</FieldLabel>
                    <Input
                      id="new-name"
                      placeholder="e.g. Mary Achieng"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="new-email">Email</FieldLabel>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="name@nira.go.ug"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Role</FieldLabel>
                    <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="district-staff">District Staff</SelectItem>
                        <SelectItem value="hq-staff">NIRA Hqtrs Staff</SelectItem>
                        <SelectItem value="systems-admin">Systems Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {newRole === "district-staff" ? (
                    <Field>
                      <FieldLabel>Assigned office</FieldLabel>
                      <Popover
                        open={districtOpen}
                        onOpenChange={(o) => {
                          setDistrictOpen(o)
                          if (!o) setDistrictQuery("")
                        }}
                      >
                        <PopoverTrigger
                          render={
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={districtOpen}
                              className="h-11 w-full justify-between font-normal"
                            >
                              <span className={cn(!newDistrict && "text-muted-foreground")}>
                                {newDistrict || "Select district..."}
                              </span>
                              <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                            </Button>
                          }
                        />
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              value={districtQuery}
                              onValueChange={setDistrictQuery}
                              placeholder="Search district..."
                            />
                            {/* Capped height keeps the list scrollable instead of
                                pushing the account form off-screen. */}
                            <CommandList className="max-h-52">
                              {districtMatches.length === 0 ? (
                                <CommandEmpty>No matching district found.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {districtMatches.map((d) => (
                                    <CommandItem
                                      key={d.id}
                                      value={d.id}
                                      onSelect={() => {
                                        setNewDistrict(d.name)
                                        setDistrictOpen(false)
                                        setDistrictQuery("")
                                      }}
                                    >
                                      <Check
                                        className={cn("size-4", newDistrict === d.name ? "opacity-100" : "opacity-0")}
                                      />
                                      <span className="flex-1">{d.name}</span>
                                      <span className="text-xs text-muted-foreground">{d.code}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FieldDescription>Staff only see notices for this district office.</FieldDescription>
                    </Field>
                  ) : isHqRole ? (
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <p className="text-xs font-medium text-foreground">Attached to {HQ_OFFICE_NAME}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        HQ staff issue from Headquarters and can refer to any district, but not to Headquarters itself.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Systems Admins have national access across all districts.
                    </p>
                  )}
                  {requiresDepartment ? (
                    <Field>
                      <FieldLabel>Directorate / Department</FieldLabel>
                      <Select value={newDepartment} onValueChange={(v) => setNewDepartment(v ?? "")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select directorate / department..." />
                        </SelectTrigger>
                        <SelectContent>
                          {HQ_DIRECTORATES.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        HQ officers must be attached to a directorate; it is printed on notices they issue.
                      </FieldDescription>
                    </Field>
                  ) : null}
                </FieldGroup>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-2">
                <Button className="w-full" onClick={addOfficer}>
                  <Plus data-icon="inline-start" />
                  Add account
                </Button>
                <p className="text-xs text-muted-foreground">
                  New accounts start with the default password{" "}
                  <span className="font-medium text-foreground">{DEFAULT_PASSWORD}</span> and are prompted to change it
                  at first sign-in.
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* System health monitoring */}
        <TabsContent value="health" className="pt-6">
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <HealthCard
                label="SMS gateway"
                value={channelSettings.sms ? "Operational" : "Disabled"}
                hint={channelSettings.sms ? `${deliveryRate}% delivery rate` : "Turned off in channels"}
                tone={!channelSettings.sms ? "warn" : deliveryRate >= 90 ? "ok" : "warn"}
                icon={MessageSquare}
              />
              <HealthCard
                label="Email service"
                value={channelSettings.email ? "Operational" : "Disabled"}
                hint={channelSettings.email ? "PDF attachments enabled" : "Turned off in channels"}
                tone={channelSettings.email ? "ok" : "warn"}
                icon={Mail}
              />
              <HealthCard
                label="PDF generation"
                value={channelSettings.print ? "Operational" : "Disabled"}
                hint="Signed notice documents"
                tone={channelSettings.print ? "ok" : "warn"}
                icon={Printer}
              />
              <HealthCard
                label="Offline sync queue"
                value={queued === 0 ? "Empty" : `${queued} pending`}
                hint={queued === 0 ? "All notices synced" : "Awaiting connectivity"}
                tone={queued === 0 ? "ok" : "warn"}
                icon={CloudOff}
              />
              <HealthCard
                label="Failed deliveries"
                value={String(failed)}
                hint={failed === 0 ? "No delivery failures" : "Need follow-up"}
                tone={failed === 0 ? "ok" : failed > 3 ? "down" : "warn"}
                icon={AlertTriangle}
              />
              <HealthCard
                label="Notices in system"
                value={String(totalNotices)}
                hint="Across all districts"
                tone="ok"
                icon={CheckCircle2}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Service status</CardTitle>
                <CardDescription>Live status of core system components.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border pt-0">
                {[
                  { name: "Notice issuing service", ok: true },
                  { name: "Register & search", ok: true },
                  { name: "SMS delivery channel", ok: channelSettings.sms },
                  { name: "Email delivery channel", ok: channelSettings.email },
                  { name: "Local offline storage", ok: true },
                ].map((svc) => (
                  <div key={svc.name} className="flex items-center justify-between py-3">
                    <span className="text-sm text-foreground">{svc.name}</span>
                    <span className="inline-flex items-center gap-2 text-sm">
                      <span
                        className={`size-2 rounded-full ${svc.ok ? "bg-success" : "bg-warning"}`}
                      />
                      <span className={svc.ok ? "text-foreground" : "text-muted-foreground"}>
                        {svc.ok ? "Operational" : "Disabled"}
                      </span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Delivery-channel settings */}
        <TabsContent value="channels" className="pt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Delivery channels</CardTitle>
              <CardDescription>
                Control which channels are used to deliver outcome notices system-wide.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="c-sms">
                    SMS notifications
                    <FieldDescription>Send outcome notices to client phones.</FieldDescription>
                  </FieldLabel>
                  <Switch
                    id="c-sms"
                    checked={channelSettings.sms}
                    onCheckedChange={(v) => {
                      updateChannelSettings({ sms: v })
                      toast.success(`SMS delivery ${v ? "enabled" : "disabled"}`)
                    }}
                  />
                </Field>
                <Separator />
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="c-email">
                    Email notifications
                    <FieldDescription>Email a PDF copy where an address is on record.</FieldDescription>
                  </FieldLabel>
                  <Switch
                    id="c-email"
                    checked={channelSettings.email}
                    onCheckedChange={(v) => {
                      updateChannelSettings({ email: v })
                      toast.success(`Email delivery ${v ? "enabled" : "disabled"}`)
                    }}
                  />
                </Field>
                <Separator />
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="c-print">
                    Printed PDF notice
                    <FieldDescription>Generate a signed PDF handed to the client at the window.</FieldDescription>
                  </FieldLabel>
                  <Switch
                    id="c-print"
                    checked={channelSettings.print}
                    onCheckedChange={(v) => {
                      updateChannelSettings({ print: v })
                      toast.success(`PDF notices ${v ? "enabled" : "disabled"}`)
                    }}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Changes apply immediately to new notices. Delivery confirmation is shown
                asynchronously once each channel reports back.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={resetTarget !== null} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password?</DialogTitle>
            <DialogDescription>
              {resetTarget ? (
                <>
                  This resets{" "}
                  <span className="font-medium text-foreground">{resetTarget.name}</span>&apos;s password to the
                  default <span className="font-medium text-foreground">{DEFAULT_PASSWORD}</span>. They will be
                  required to set a new password the next time they sign in.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmReset}>
              <KeyRound data-icon="inline-start" />
              Reset to {DEFAULT_PASSWORD}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
