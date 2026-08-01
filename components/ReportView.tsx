'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Printer, Send, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UpgradeNotice } from '@/components/UpgradeNotice'
import { exportReportCsvAction, sendReportNowAction } from '@/lib/actions'

type SummaryMetric = { label: string; value: string; change: number | null }
type ReportSection = {
  title: string
  columns: string[]
  rows: (string | number)[][]
  empty: string
}

type Props = {
  reportId: string
  report: {
    name: string
    typeLabel: string
    rangeDays: number
    from: Date
    to: Date
    generatedAt: Date
    workspaceName: string
    scopeLabel: string
    summary: SummaryMetric[]
    sections: ReportSection[]
    hasData: boolean
  }
  recipients: string[]
  schedule: string | null
  lastSentAt: Date | null
  canSend: boolean
  canExport: boolean
  isOwner: boolean
  emailConfigured: boolean
}

function dateLabel(value: Date) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function Change({ change }: { change: number | null }) {
  if (change === null) {
    return <span className="text-xs text-muted-foreground">No prior data</span>
  }
  const positive = change >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <span
      className={`text-xs inline-flex items-center gap-1 ${
        positive ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      <Icon size={12} />
      {positive ? '+' : ''}
      {change}% vs prior period
    </span>
  )
}

export function ReportView({
  reportId,
  report,
  recipients,
  schedule,
  lastSentAt,
  canSend,
  canExport,
  isOwner,
  emailConfigured,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const exportCsv = () => {
    setError('')
    setNotice('')
    startTransition(async () => {
      const result = await exportReportCsvAction(reportId)
      if (result.error || !result.csv) {
        setError(result.error || 'Could not build the export.')
        return
      }
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = result.filename || 'report.csv'
      anchor.click()
      URL.revokeObjectURL(url)
    })
  }

  const sendNow = () => {
    setError('')
    setNotice('')
    startTransition(async () => {
      const result = await sendReportNowAction(reportId)
      if (result.error) {
        setError(result.error)
        return
      }
      setNotice(`Report emailed to ${result.sent} recipient${result.sent === 1 ? '' : 's'}.`)
    })
  }

  return (
    <div className="report-surface">
      <div className="no-print mb-6">
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} />
          All reports
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">{report.name}</h1>
          <p className="text-muted-foreground">
            {report.typeLabel} report for {report.workspaceName} · {dateLabel(report.from)} –{' '}
            {dateLabel(report.to)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Links covered: <span className="text-foreground">{report.scopeLabel}</span>
          </p>
        </div>

        {canExport && (
          <div className="no-print flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={pending}>
              <Download size={16} />
              Export CSV
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer size={16} />
              Save as PDF
            </Button>
            {canSend && recipients.length > 0 && (
              <Button className="gap-2" onClick={sendNow} disabled={pending || !emailConfigured}>
                <Send size={16} />
                {pending ? 'Sending…' : 'Email now'}
              </Button>
            )}
          </div>
        )}
      </div>

      {!canExport && (
        <UpgradeNotice
          className="no-print mb-6"
          title="Exporting and emailing reports is a Pro feature"
          description="You can read this report on any plan. Pro adds CSV export, PDF download, and automatic weekly or monthly delivery to your inbox."
          isOwner={isOwner}
        />
      )}

      {error && (
        <div className="no-print mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="no-print mb-4 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">
          {notice}
        </div>
      )}

      <div className="no-print mb-6 text-sm text-muted-foreground">
        {recipients.length === 0 ? (
          <span>No recipients on this report — export it or add recipients to email it.</span>
        ) : (
          <span>
            Goes to {recipients.join(', ')} ·{' '}
            {schedule ? `sent ${schedule}` : 'only when you send it'} ·{' '}
            {lastSentAt ? `last sent ${dateLabel(lastSentAt)}` : 'never sent'}
          </span>
        )}
      </div>

      {!report.hasData && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-card/50 text-sm text-muted-foreground">
          No clicks were recorded in this period, so the figures below are all zero. Share a short
          link to start collecting data.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {report.summary.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-border bg-card/50 p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              {metric.label}
            </p>
            <p className="text-3xl font-bold mb-1">{metric.value}</p>
            <Change change={metric.change} />
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {report.sections.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-border bg-card/50 overflow-hidden"
          >
            <h2 className="text-lg font-semibold px-6 py-4 border-b border-border">
              {section.title}
            </h2>
            {section.rows.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">{section.empty}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      {section.columns.map((column) => (
                        <th
                          key={column}
                          className="text-left py-3 px-6 font-medium text-muted-foreground"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row, index) => (
                      <tr key={index} className="border-b border-border/30 last:border-0">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="py-3 px-6">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Generated {new Date(report.generatedAt).toLocaleString('en-GB')} · covering the last{' '}
        {report.rangeDays} days
      </p>
    </div>
  )
}
