"use client"

import { useState } from "react"
import {
  Users,
  Building2,
  MessageSquareText,
  SlidersHorizontal,
  Plus,
  ShieldCheck,
  UserCog,
} from "lucide-react"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatCard } from "@/components/stat-card"
import { OFFICES, OFFICERS } from "@/lib/nira"

type Role = "Administrator" | "Senior Officer" | "Registration Officer" | "Assistant"

interface OfficerRow {
  name: string
  role: Role
  office: string
  active: boolean
}

function parseOfficers(): OfficerRow[] {
  return OFFICERS.map((entry, i) => {
    const [name, title = ""] = entry.split(" — ")
    const role: Role =
      i === 0
        ? "Administrator"
        : title.includes("Senior")
          ? "Senior Officer"
          : title.includes("Assistant")
            ? "Assistant"
            : "Registration Officer"
    return { name, role, office: OFFICES[i % OFFICES.length], active: i % 4 !== 3 }
  })
}

const ROLE_TONE: Record<Role, "default" | "secondary" | "outline"> = {
  Administrator: "default",
  "Senior Officer": "secondary",
  "Registration Officer": "outline",
  Assistant: "outline",
}

export function AdminPanel() {
  const [officers, setOfficers] = useState<OfficerRow[]>(parseOfficers)
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState<Role>("Registration Officer")
  const [newOffice, setNewOffice] = useState<string>(OFFICES[0])

  const [smsTemplate, setSmsTemplate] = useState(
    "NIRA: Dear {name}, your {service} outcome notice {ref} has been issued at {office}. Next step: {action}. Verify at nira.go.ug.",
  )
  const [emailSubject, setEmailSubject] = useState("Your NIRA Service Outcome Notice — {ref}")

  const [settings, setSettings] = useState({
    smsDelivery: true,
    emailDelivery: true,
    autoQr: true,
    requireSupervisor: false,
    offlineQueue: true,
  })

  const admins = officers.filter((o) => o.role === "Administrator").length
  const activeCount = officers.filter((o) => o.active).length

  function addOfficer() {
    if (!newName.trim()) {
      toast.error("Enter the officer's full name")
      return
    }
    setOfficers((prev) => [
      { name: newName.trim(), role: newRole, office: newOffice, active: true },
      ...prev,
    ])
    setNewName("")
    toast.success(`${newName.trim()} added as ${newRole}`)
  }

  function toggleActive(name: string) {
    setOfficers((prev) => prev.map((o) => (o.name === name ? { ...o, active: !o.active } : o)))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Registered officers" value={officers.length} icon={Users} />
        <StatCard label="Active accounts" value={activeCount} icon={ShieldCheck} tone="success" />
        <StatCard label="Administrators" value={admins} icon={UserCog} />
        <StatCard label="Service offices" value={OFFICES.length} icon={Building2} />
      </div>

      <Tabs defaultValue="officers">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="officers">
            <Users data-icon="inline-start" />
            Officers &amp; Roles
          </TabsTrigger>
          <TabsTrigger value="offices">
            <Building2 data-icon="inline-start" />
            Offices
          </TabsTrigger>
          <TabsTrigger value="templates">
            <MessageSquareText data-icon="inline-start" />
            Notice Templates
          </TabsTrigger>
          <TabsTrigger value="system">
            <SlidersHorizontal data-icon="inline-start" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="officers" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <Card>
              <CardHeader>
                <CardTitle>Officer accounts</CardTitle>
                <CardDescription>
                  Manage who can issue notices and their access level across the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Officer</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">Office</TableHead>
                      <TableHead className="pr-6 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {officers.map((o) => (
                      <TableRow key={o.name}>
                        <TableCell className="pl-6 font-medium text-foreground">{o.name}</TableCell>
                        <TableCell>
                          <Badge variant={ROLE_TONE[o.role]}>{o.role}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {o.office}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <button
                            type="button"
                            onClick={() => toggleActive(o.name)}
                            className="inline-flex items-center gap-2 text-sm"
                          >
                            <span
                              className={
                                o.active
                                  ? "size-2 rounded-full bg-success"
                                  : "size-2 rounded-full bg-muted-foreground/40"
                              }
                            />
                            <span className={o.active ? "text-foreground" : "text-muted-foreground"}>
                              {o.active ? "Active" : "Disabled"}
                            </span>
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base">Add officer</CardTitle>
                <CardDescription>Create a new staff account.</CardDescription>
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
                    <FieldLabel>Role</FieldLabel>
                    <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administrator">Administrator</SelectItem>
                        <SelectItem value="Senior Officer">Senior Officer</SelectItem>
                        <SelectItem value="Registration Officer">Registration Officer</SelectItem>
                        <SelectItem value="Assistant">Assistant</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Assigned office</FieldLabel>
                    <Select value={newOffice} onValueChange={setNewOffice}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OFFICES.map((office) => (
                          <SelectItem key={office} value={office}>
                            {office}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={addOfficer}>
                  <Plus data-icon="inline-start" />
                  Add officer
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="offices" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Service offices</CardTitle>
              <CardDescription>Offices authorised to issue outcome notices.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Office</TableHead>
                    <TableHead>Officers</TableHead>
                    <TableHead className="pr-6 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {OFFICES.map((office) => (
                    <TableRow key={office}>
                      <TableCell className="pl-6 font-medium text-foreground">{office}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {officers.filter((o) => o.office === office).length} assigned
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Badge variant="secondary">Operational</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SMS notification</CardTitle>
                <CardDescription>
                  Sent to the client when a notice is issued. Use tags like {"{name}"} and {"{ref}"}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="sms-tpl">Message body</FieldLabel>
                    <Textarea
                      id="sms-tpl"
                      rows={5}
                      value={smsTemplate}
                      onChange={(e) => setSmsTemplate(e.target.value)}
                    />
                    <FieldDescription>{smsTemplate.length} characters</FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => toast.success("SMS template saved")}>
                  Save template
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email notification</CardTitle>
                <CardDescription>Subject line and delivery preferences for emailed notices.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email-subj">Subject line</FieldLabel>
                    <Input
                      id="email-subj"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </Field>
                  <Separator />
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="attach-pdf">Attach signed PDF notice</FieldLabel>
                    <Switch id="attach-pdf" defaultChecked />
                  </Field>
                </FieldGroup>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => toast.success("Email template saved")}>
                  Save template
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="pt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>System settings</CardTitle>
              <CardDescription>Control delivery channels and issuing rules system-wide.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="s-sms">
                    SMS delivery
                    <FieldDescription>Send outcome notices to client phones.</FieldDescription>
                  </FieldLabel>
                  <Switch
                    id="s-sms"
                    checked={settings.smsDelivery}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, smsDelivery: v }))}
                  />
                </Field>
                <Separator />
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="s-email">
                    Email delivery
                    <FieldDescription>Email a copy where an address is on record.</FieldDescription>
                  </FieldLabel>
                  <Switch
                    id="s-email"
                    checked={settings.emailDelivery}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, emailDelivery: v }))}
                  />
                </Field>
                <Separator />
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="s-qr">
                    Auto QR verification
                    <FieldDescription>Embed a verification QR code on every notice.</FieldDescription>
                  </FieldLabel>
                  <Switch
                    id="s-qr"
                    checked={settings.autoQr}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, autoQr: v }))}
                  />
                </Field>
                <Separator />
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="s-sup">
                    Require supervisor approval
                    <FieldDescription>High-impact notices need a second sign-off.</FieldDescription>
                  </FieldLabel>
                  <Switch
                    id="s-sup"
                    checked={settings.requireSupervisor}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, requireSupervisor: v }))}
                  />
                </Field>
                <Separator />
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="s-off">
                    Offline queue
                    <FieldDescription>Hold notices locally and sync when back online.</FieldDescription>
                  </FieldLabel>
                  <Switch
                    id="s-off"
                    checked={settings.offlineQueue}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, offlineQueue: v }))}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast.success("System settings saved")}>Save settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
