'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UpgradeNotice } from '@/components/UpgradeNotice'
import { createReportAction, deleteReportAction } from '@/lib/actions'
import { formatRelativeTime } from '@/lib/utils-helpers'

type ReportType = 'performance' | 'audience' | 'conversion' | 'custom'
type Schedule = 'none' | 'weekly' | 'monthly'

type ReportItem = {
  id: string
  name: string
  type: string
  rangeDays: number
  schedule: string | null
  recipients: string
  lastSentAt: Date | null
  createdAt: Date
  /** False means the report covers every link in the workspace. */
  scoped: boolean
  /** Titles of the scoped links that still exist. */
  scopeTitles: string[]
}

type LinkOption = { id: string; title: string; alias: string }

const TYPE_LABELS: Record<ReportType, string> = {
  performance: 'Performance',
  audience: 'Audience',
  conversion: 'Conversion',
  custom: 'Custom',
}

const TYPE_HELP: Record<ReportType, string> = {
  performance: 'Clicks and visitors over time, plus your best performing links.',
  audience: 'Who is clicking: devices, browsers, countries and languages.',
  conversion: 'How well links hold attention — return rates and repeat visitors.',
  custom: 'Everything above in one combined document.',
}

const RANGES = [7, 14, 30, 90]

const EMPTY_FORM = {
  name: '',
  type: 'performance' as ReportType,
  rangeDays: 30,
  schedule: 'none' as Schedule,
  recipients: '',
}

export function ReportsManager({
  initialReports,
  links = [],
  canEdit = true,
  canSchedule = true,
  isOwner = true,
  emailConfigured = false,
}: {
  initialReports: ReportItem[]
  links?: LinkOption[]
  canEdit?: boolean
  canSchedule?: boolean
  isOwner?: boolean
  emailConfigured?: boolean
}) {
  const router = useRouter()
  const [reports, setReports] = useState(initialReports)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [scope, setScope] = useState<'all' | 'selected'>('all')
  const [selectedLinks, setSelectedLinks] = useState<string[]>([])
  const [linkFilter, setLinkFilter] = useState('')

  const visibleLinks = links.filter((link) => {
    const needle = linkFilter.trim().toLowerCase()
    if (!needle) return true
    return (
      link.title.toLowerCase().includes(needle) || link.alias.toLowerCase().includes(needle)
    )
  })

  const toggleLink = (id: string) => {
    setSelectedLinks((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    )
  }

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (scope === 'selected' && selectedLinks.length === 0) {
      setError('Pick at least one link, or switch back to all links.')
      return
    }

    startTransition(async () => {
      const result = await createReportAction({
        ...form,
        linkIds: scope === 'selected' ? selectedLinks : [],
      })
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.report) {
        const scopeTitles =
          scope === 'selected'
            ? links.filter((link) => selectedLinks.includes(link.id)).map((link) => link.title)
            : []
        setReports((prev) => [
          { ...result.report, scoped: scope === 'selected', scopeTitles },
          ...prev,
        ])
        setForm(EMPTY_FORM)
        setScope('all')
        setSelectedLinks([])
        setLinkFilter('')
        router.refresh()
      }
    })
  }

  const remove = (id: string) => {
    startTransition(async () => {
      const result = await deleteReportAction(id)
      if (result.error) {
        setError(result.error)
        return
      }
      setReports((prev) => prev.filter((r) => r.id !== id))
      router.refresh()
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">
          Build a reporting view once, then open, export, or email it whenever you need it
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>
      )}

      {!canSchedule && (
        <UpgradeNotice
          className="mb-6"
          title="Reports are read-only on the Free plan"
          description="Create and open as many reports as you like. Pro adds CSV export, PDF download, and scheduled email delivery."
          isOwner={isOwner}
        />
      )}

      {canEdit && (
        <form
          onSubmit={create}
          className="mb-8 rounded-xl border border-border bg-card/50 p-5 space-y-4"
        >
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs text-muted-foreground mb-1.5">Report name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Weekly performance"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ReportType })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              >
                {(Object.keys(TYPE_LABELS) as ReportType[]).map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Period covered</label>
              <select
                value={form.rangeDays}
                onChange={(e) => setForm({ ...form, rangeDays: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              >
                {RANGES.map((days) => (
                  <option key={days} value={days}>
                    Last {days} days
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{TYPE_HELP[form.type]}</p>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Links covered</label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'All links'],
                  ['selected', 'Specific links'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScope(value)}
                  disabled={value === 'selected' && links.length === 0}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors disabled:opacity-40 ${
                    scope === value
                      ? 'border-primary bg-primary/15 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {links.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-2">
                You don&apos;t have any links yet, so this report will cover the whole workspace.
              </p>
            ) : scope === 'selected' ? (
              <div className="mt-3 rounded-lg border border-border bg-background p-3">
                {links.length > 6 && (
                  <input
                    value={linkFilter}
                    onChange={(e) => setLinkFilter(e.target.value)}
                    placeholder="Search links…"
                    className="w-full mb-2 px-3 py-1.5 rounded-lg border border-border bg-card/50 text-sm"
                  />
                )}

                <div className="max-h-52 overflow-y-auto pr-1 space-y-1">
                  {visibleLinks.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      No links match &ldquo;{linkFilter}&rdquo;.
                    </p>
                  ) : (
                    visibleLinks.map((link) => (
                      <label
                        key={link.id}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLinks.includes(link.id)}
                          onChange={() => toggleLink(link.id)}
                          className="shrink-0"
                        />
                        <span className="text-sm truncate">{link.title}</span>
                        <span className="text-xs text-muted-foreground truncate ml-auto">
                          /{link.alias}
                        </span>
                      </label>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    {selectedLinks.length} of {links.length} selected
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedLinks(visibleLinks.map((link) => link.id))}
                      className="text-xs text-primary hover:underline"
                    >
                      Select {linkFilter.trim() ? 'these' : 'all'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLinks([])}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                Every link in the workspace counts toward this report.
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Email schedule</label>
              <select
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value as Schedule })}
                disabled={!canSchedule}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background disabled:opacity-50"
              >
                <option value="none">Don&apos;t send automatically</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
              </select>
              {!canSchedule && (
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduling requires Pro
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">
                Recipients {form.schedule === 'none' && '(optional)'}
              </label>
              <input
                value={form.recipients}
                onChange={(e) => setForm({ ...form, recipients: e.target.value })}
                placeholder="you@example.com, teammate@example.com"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              />
            </div>
          </div>

          {!emailConfigured && form.schedule !== 'none' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-400 text-sm">
              <Mail size={16} className="mt-0.5 shrink-0" />
              <span>
                Email delivery isn&apos;t configured, so scheduled sends won&apos;t go out until
                <code className="mx-1">RESEND_API_KEY</code> is set. You can still open and export
                the report.
              </span>
            </div>
          )}

          <Button type="submit" disabled={pending} className="gap-2">
            <Plus size={16} />
            {pending ? 'Saving…' : 'Create report'}
          </Button>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Period</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Links</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Schedule</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Last sent</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-6 text-center text-muted-foreground">
                    {canEdit
                      ? 'No reports yet. Create one above to get a shareable view of your analytics.'
                      : 'No reports in this workspace yet.'}
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const type = (report.type as ReportType) || 'performance'
                  return (
                    <tr key={report.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-4 px-6">
                        <Link
                          href={`/dashboard/reports/${report.id}`}
                          className="font-medium hover:text-primary inline-flex items-center gap-1.5"
                        >
                          {report.name}
                          <ArrowRight size={14} className="opacity-50" />
                        </Link>
                        {report.recipients && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {report.recipients.split(',').length} recipient
                            {report.recipients.split(',').length === 1 ? '' : 's'}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6">{TYPE_LABELS[type] || report.type}</td>
                      <td className="py-4 px-6 text-muted-foreground">
                        Last {report.rangeDays} days
                      </td>
                      <td className="py-4 px-6" title={report.scopeTitles.join(', ')}>
                        {!report.scoped ? (
                          <span className="text-muted-foreground">All links</span>
                        ) : report.scopeTitles.length === 0 ? (
                          <span className="text-amber-400">Links deleted</span>
                        ) : report.scopeTitles.length === 1 ? (
                          <span className="block max-w-[180px] truncate">
                            {report.scopeTitles[0]}
                          </span>
                        ) : (
                          <span>{report.scopeTitles.length} links</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {report.schedule ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent capitalize">
                            {report.schedule}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Manual</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        {report.lastSentAt
                          ? formatRelativeTime(new Date(report.lastSentAt))
                          : 'Never'}
                      </td>
                      <td className="py-4 px-6">
                        {canEdit && (
                          <button
                            onClick={() => remove(report.id)}
                            className="p-2 hover:bg-muted rounded-lg"
                            title="Delete report"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
