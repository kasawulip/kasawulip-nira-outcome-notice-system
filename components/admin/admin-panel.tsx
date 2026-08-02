"use client"

import { useState } from "react"
import { Building2, Users, MessageSquare, Settings2, Plus, Check } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OFFICES, OFFICERS } from "@/lib/nira"

export function AdminPanel() {
  const [smsTemplate, setSmsTemplate] = useState(
    "Dear {{client}}, NIRA has issued an outcome notice ({{noticeNo}}) regarding your {{service}}. View: {{link}}",
  )
  const [emailSubject, setEmailSubject] = useState("NIRA Outcome Notice — {{noticeNo}}")
  const [autoSms, setAutoSms] = useState(true)
  const [autoEmail, setAutoEmail] = useState(true)
  const [requireNin, setRequireNin] = useState(true)
  const [offlineQueue, setOfflineQueue] = useState(true)

  return (
    <Tabs defaultValue="offices" className="w-full">
      <TabsList>
        <TabsTrigger value="offices">
          <Building2 data-icon="inline-start" />
          Offices
        </TabsTrigger>
        <TabsTrigger value="officers">
          <Users data-icon="inline-start" />
          Officers
        </TabsTrigger>
        <TabsTrigger value="templates">
          <MessageSquare data-icon="inline-start" />
          Templates
        </TabsTrigger>
        <TabsTrigger value="system">
          <Settings2 data-icon="inline-start" />
          System
        </TabsTrigger>
      </TabsList>

      <TabsContent value="offices" className="mt-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Registration offices</CardTitle>
              <CardDescription>NIRA offices authorised to issue outcome notices.</CardDescription>
            </div>
            <Button size="sm" onClick={() => toast.info("Add office form")}>
              <Plus data-icon="inline-start" />
              Add office
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Office</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {OFFICES.map((office) => (
                  <TableRow key={office}>
                    <TableCell className="font-medium">{office}</TableCell>
                    <TableCell className="text-muted-foreground">Central</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="officers" className="mt-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Registration officers</CardTitle>
              <CardDescription>Staff accounts permitted to create and issue notices.</CardDescription>
            </div>
            <Button size="sm" onClick={() => toast.info("Add officer form")}>
              <Plus data-icon="inline-start" />
              Add officer
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {OFFICERS.map((officer, i) => (
                  <TableRow key={officer}>
                    <TableCell className="font-medium">{officer}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {i === 0 ? "Senior Registration Officer" : "Registration Officer"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="templates" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification templates</CardTitle>
            <CardDescription>
              Message templates used when notices are delivered. Use placeholders like {"{{client}}"} and{" "}
              {"{{noticeNo}}"}.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="sms-template">SMS template</FieldLabel>
                <Textarea
                  id="sms-template"
                  value={smsTemplate}
                  onChange={(e) => setSmsTemplate(e.target.value)}
                  rows={3}
                />
                <FieldDescription>{smsTemplate.length} characters (approx {Math.ceil(smsTemplate.length / 160)} SMS segment(s))</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="email-subject">Email subject line</FieldLabel>
                <Input id="email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              </Field>
            </FieldGroup>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => toast.success("Templates saved")}>
                <Check data-icon="inline-start" />
                Save templates
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="system" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>System configuration</CardTitle>
            <CardDescription>Global rules for notice creation and delivery.</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="flex flex-col gap-1 pt-2">
            <ToggleRow
              label="Auto-send SMS on issue"
              description="Automatically dispatch an SMS notification when a notice is issued."
              checked={autoSms}
              onChange={setAutoSms}
            />
            <Separator />
            <ToggleRow
              label="Auto-send email on issue"
              description="Send the PDF notice by email when a client email is on record."
              checked={autoEmail}
              onChange={setAutoEmail}
            />
            <Separator />
            <ToggleRow
              label="Require NIN before issue"
              description="Block issuing a notice unless a valid National Identification Number is captured."
              checked={requireNin}
              onChange={setRequireNin}
            />
            <Separator />
            <ToggleRow
              label="Offline queue for field offices"
              description="Allow notices to be captured offline and synced when connectivity returns."
              checked={offlineQueue}
              onChange={setOfflineQueue}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
