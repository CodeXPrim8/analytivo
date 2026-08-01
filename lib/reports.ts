import { format, startOfDay, subDays } from 'date-fns'
import { prisma } from '@/lib/db'
import { getLinkStats, percentChange } from '@/lib/analytics'
import { shortUrlFor } from '@/lib/links'

export const REPORT_TYPES = ['performance', 'audience', 'conversion', 'custom'] as const
export type ReportType = (typeof REPORT_TYPES)[number]

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  performance: 'Performance',
  audience: 'Audience',
  conversion: 'Conversion',
  custom: 'Custom',
}

export const REPORT_TYPE_HELP: Record<ReportType, string> = {
  performance: 'Clicks and visitors over time, plus your best performing links.',
  audience: 'Who is clicking: devices, browsers, countries and languages.',
  conversion: 'How well links hold attention — return rates and repeat visitors.',
  custom: 'Everything above in one combined document.',
}

export const RANGE_OPTIONS = [7, 14, 30, 90] as const
export const SCHEDULE_OPTIONS = ['none', 'weekly', 'monthly'] as const
export type Schedule = (typeof SCHEDULE_OPTIONS)[number]

export type SummaryMetric = {
  label: string
  value: string
  /** Percent change vs the preceding window of the same length. */
  change: number | null
}

export type ReportSection = {
  title: string
  columns: string[]
  rows: (string | number)[][]
  empty: string
}

export type BuiltReport = {
  name: string
  type: ReportType
  typeLabel: string
  rangeDays: number
  from: Date
  to: Date
  generatedAt: Date
  workspaceName: string
  summary: SummaryMetric[]
  sections: ReportSection[]
  hasData: boolean
}

export function normalizeType(value: string): ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value) ? (value as ReportType) : 'performance'
}

export function parseRecipients(value: string): string[] {
  return value
    .split(/[,\s;]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.includes('@'))
}

const num = (value: number) => value.toLocaleString('en-US')
const pct = (value: number) => `${value.toFixed(1)}%`

/** Growth from a zero baseline isn't a percentage, so report it as no comparison. */
function changeFrom(current: number, previous: number) {
  return previous === 0 ? null : percentChange(current, previous)
}

function rangeWhere(ownerId: string, from: Date) {
  return { createdAt: { gte: from }, link: { userId: ownerId } }
}

/** Counts of a single click attribute over the window, biggest first. */
async function breakdown(
  ownerId: string,
  field: 'source' | 'device' | 'browser' | 'os' | 'country' | 'language',
  from: Date,
  fallback: string,
  limit = 10,
) {
  const grouped = await prisma.click.groupBy({
    by: [field],
    where: rangeWhere(ownerId, from),
    _count: { _all: true },
  })

  const counts = new Map<string, number>()
  for (const row of grouped) {
    const key = (row[field] as string | null) || fallback
    counts.set(key, (counts.get(key) || 0) + row._count._all)
  }

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1
  return Array.from(counts.entries())
    .map(([label, clicks]) => ({ label, clicks, share: Math.round((clicks / total) * 100) }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit)
}

async function topLinks(ownerId: string, from: Date, limit = 10) {
  const grouped = await prisma.click.groupBy({
    by: ['linkId'],
    where: rangeWhere(ownerId, from),
    _count: { _all: true },
  })

  const ranked = grouped
    .map((row) => ({ linkId: row.linkId, clicks: row._count._all }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit)

  if (ranked.length === 0) return []

  const ids = ranked.map((row) => row.linkId)
  const [links, uniqueRows] = await Promise.all([
    prisma.link.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, alias: true },
    }),
    prisma.click.groupBy({
      by: ['linkId', 'visitorId'],
      where: { linkId: { in: ids }, createdAt: { gte: from } },
    }),
  ])

  const uniqueByLink = new Map<string, number>()
  for (const row of uniqueRows) {
    uniqueByLink.set(row.linkId, (uniqueByLink.get(row.linkId) || 0) + 1)
  }
  const linkById = new Map(links.map((link) => [link.id, link]))

  return ranked.map((row) => {
    const link = linkById.get(row.linkId)
    const unique = uniqueByLink.get(row.linkId) || 0
    return {
      title: link?.title || 'Deleted link',
      shortUrl: link ? shortUrlFor(link.alias) : '—',
      clicks: row.clicks,
      unique,
      repeatRate: unique > 0 ? Math.round((row.clicks / unique) * 100) / 100 : 0,
    }
  })
}

async function dailyClicks(ownerId: string, from: Date, days: number) {
  const clicks = await prisma.click.findMany({
    where: rangeWhere(ownerId, from),
    select: { createdAt: true },
  })

  const byDay = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    byDay.set(format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd'), 0)
  }
  for (const click of clicks) {
    const key = format(click.createdAt, 'yyyy-MM-dd')
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) || 0) + 1)
  }

  // Newest first: the recent days matter most, and email tables are truncated.
  return Array.from(byDay.entries())
    .map(([date, count]) => ({ date, clicks: count }))
    .reverse()
}

/** Repeat-visit behaviour per traffic source. */
async function sourceQuality(ownerId: string, from: Date, limit = 10) {
  const [all, returning] = await Promise.all([
    prisma.click.groupBy({
      by: ['source'],
      where: rangeWhere(ownerId, from),
      _count: { _all: true },
    }),
    prisma.click.groupBy({
      by: ['source'],
      where: { ...rangeWhere(ownerId, from), isReturning: true },
      _count: { _all: true },
    }),
  ])

  const returningBySource = new Map<string, number>()
  for (const row of returning) {
    returningBySource.set(row.source || 'direct', row._count._all)
  }

  return all
    .map((row) => {
      const source = row.source || 'direct'
      const clicks = row._count._all
      const repeat = returningBySource.get(source) || 0
      return {
        source,
        clicks,
        repeat,
        rate: clicks > 0 ? Math.round((repeat / clicks) * 1000) / 10 : 0,
      }
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit)
}

export async function buildReport(
  ownerId: string,
  options: { name: string; type: ReportType; rangeDays: number; workspaceName: string },
): Promise<BuiltReport> {
  const { name, type, rangeDays, workspaceName } = options
  const to = new Date()
  const from = startOfDay(subDays(to, rangeDays - 1))
  const previousFrom = startOfDay(subDays(to, rangeDays * 2 - 1))

  const [current, previous] = await Promise.all([
    getLinkStats(ownerId, undefined, { from }),
    getLinkStats(ownerId, undefined, { from: previousFrom, to: from }),
  ])

  const returnRate = (stats: { uniqueVisitors: number; returningVisitors: number }) =>
    stats.uniqueVisitors > 0
      ? Math.round((stats.returningVisitors / stats.uniqueVisitors) * 1000) / 10
      : 0

  const currentRate = returnRate(current)
  const previousRate = returnRate(previous)

  const summaryByType: Record<ReportType, SummaryMetric[]> = {
    performance: [
      {
        label: 'Total clicks',
        value: num(current.totalClicks),
        change: changeFrom(current.totalClicks, previous.totalClicks),
      },
      {
        label: 'Unique visitors',
        value: num(current.uniqueVisitors),
        change: changeFrom(current.uniqueVisitors, previous.uniqueVisitors),
      },
      {
        label: 'Returning visitors',
        value: num(current.returningVisitors),
        change: changeFrom(current.returningVisitors, previous.returningVisitors),
      },
      { label: 'Return rate', value: pct(currentRate), change: changeFrom(currentRate, previousRate) },
    ],
    audience: [
      {
        label: 'Unique visitors',
        value: num(current.uniqueVisitors),
        change: changeFrom(current.uniqueVisitors, previous.uniqueVisitors),
      },
      {
        label: 'Total clicks',
        value: num(current.totalClicks),
        change: changeFrom(current.totalClicks, previous.totalClicks),
      },
      {
        label: 'Returning visitors',
        value: num(current.returningVisitors),
        change: changeFrom(current.returningVisitors, previous.returningVisitors),
      },
      { label: 'Return rate', value: pct(currentRate), change: changeFrom(currentRate, previousRate) },
    ],
    conversion: [
      { label: 'Return rate', value: pct(currentRate), change: changeFrom(currentRate, previousRate) },
      {
        label: 'Returning visitors',
        value: num(current.returningVisitors),
        change: changeFrom(current.returningVisitors, previous.returningVisitors),
      },
      {
        label: 'Clicks per visitor',
        value:
          current.uniqueVisitors > 0
            ? (Math.round((current.totalClicks / current.uniqueVisitors) * 100) / 100).toFixed(2)
            : '0.00',
        change: null,
      },
      {
        label: 'Total clicks',
        value: num(current.totalClicks),
        change: changeFrom(current.totalClicks, previous.totalClicks),
      },
    ],
    custom: [
      {
        label: 'Total clicks',
        value: num(current.totalClicks),
        change: changeFrom(current.totalClicks, previous.totalClicks),
      },
      {
        label: 'Unique visitors',
        value: num(current.uniqueVisitors),
        change: changeFrom(current.uniqueVisitors, previous.uniqueVisitors),
      },
      {
        label: 'Returning visitors',
        value: num(current.returningVisitors),
        change: changeFrom(current.returningVisitors, previous.returningVisitors),
      },
      { label: 'Return rate', value: pct(currentRate), change: changeFrom(currentRate, previousRate) },
    ],
  }

  const sections: ReportSection[] = []
  const wantsPerformance = type === 'performance' || type === 'custom'
  const wantsAudience = type === 'audience' || type === 'custom'
  const wantsConversion = type === 'conversion' || type === 'custom'

  if (wantsPerformance) {
    const [daily, links, sources] = await Promise.all([
      dailyClicks(ownerId, from, rangeDays),
      topLinks(ownerId, from),
      breakdown(ownerId, 'source', from, 'direct'),
    ])

    sections.push({
      title: 'Top links',
      columns: ['Link', 'Short URL', 'Clicks', 'Unique'],
      rows: links.map((row) => [row.title, row.shortUrl, row.clicks, row.unique]),
      empty: 'No links were clicked in this period.',
    })
    sections.push({
      title: 'Traffic sources',
      columns: ['Source', 'Clicks', 'Share'],
      rows: sources.map((row) => [row.label, row.clicks, `${row.share}%`]),
      empty: 'No traffic recorded in this period.',
    })
    // Long and mostly flat, so it sits below the sections people read first.
    sections.push({
      title: 'Clicks per day',
      columns: ['Date', 'Clicks'],
      rows: daily.map((row) => [row.date, row.clicks]),
      empty: 'No clicks recorded in this period.',
    })
  }

  if (wantsAudience) {
    const [devices, browsers, systems, countries, languages] = await Promise.all([
      breakdown(ownerId, 'device', from, 'unknown'),
      breakdown(ownerId, 'browser', from, 'unknown'),
      breakdown(ownerId, 'os', from, 'unknown'),
      breakdown(ownerId, 'country', from, 'unknown'),
      breakdown(ownerId, 'language', from, 'unknown'),
    ])

    const audienceSections: [string, typeof devices][] = [
      ['Devices', devices],
      ['Browsers', browsers],
      ['Operating systems', systems],
      ['Countries', countries],
      ['Languages', languages],
    ]

    for (const [title, rows] of audienceSections) {
      sections.push({
        title,
        columns: [title.replace(/s$/, ''), 'Clicks', 'Share'],
        rows: rows.map((row) => [row.label, row.clicks, `${row.share}%`]),
        empty: 'No clicks recorded in this period.',
      })
    }
  }

  if (wantsConversion) {
    const [links, sources] = await Promise.all([
      topLinks(ownerId, from),
      sourceQuality(ownerId, from),
    ])

    sections.push({
      title: 'Link engagement',
      columns: ['Link', 'Clicks', 'Unique', 'Clicks per visitor'],
      rows: links.map((row) => [row.title, row.clicks, row.unique, row.repeatRate.toFixed(2)]),
      empty: 'No links were clicked in this period.',
    })
    sections.push({
      title: 'Source quality',
      columns: ['Source', 'Clicks', 'Repeat clicks', 'Repeat rate'],
      rows: sources.map((row) => [row.source, row.clicks, row.repeat, `${row.rate}%`]),
      empty: 'No traffic recorded in this period.',
    })
  }

  return {
    name,
    type,
    typeLabel: REPORT_TYPE_LABELS[type],
    rangeDays,
    from,
    to,
    generatedAt: new Date(),
    workspaceName,
    summary: summaryByType[type],
    sections,
    hasData: current.totalClicks > 0,
  }
}

/* ------------------------------------------------------------- renderers */

function csvCell(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function reportToCsv(report: BuiltReport) {
  const lines: string[] = []
  lines.push(csvCell(report.name))
  lines.push(
    [
      csvCell(report.typeLabel),
      csvCell(`${format(report.from, 'yyyy-MM-dd')} to ${format(report.to, 'yyyy-MM-dd')}`),
      csvCell(`Generated ${format(report.generatedAt, "yyyy-MM-dd HH:mm")}`),
    ].join(','),
  )
  lines.push('')

  lines.push('Summary')
  lines.push(['Metric', 'Value', 'Change vs prior period'].join(','))
  for (const metric of report.summary) {
    lines.push(
      [
        csvCell(metric.label),
        csvCell(metric.value),
        csvCell(metric.change === null ? 'n/a' : `${metric.change > 0 ? '+' : ''}${metric.change}%`),
      ].join(','),
    )
  }

  for (const section of report.sections) {
    lines.push('')
    lines.push(csvCell(section.title))
    if (section.rows.length === 0) {
      lines.push(csvCell(section.empty))
      continue
    }
    lines.push(section.columns.map(csvCell).join(','))
    for (const row of section.rows) {
      lines.push(row.map(csvCell).join(','))
    }
  }

  return lines.join('\n')
}

export function reportFileName(report: BuiltReport) {
  const slug =
    report.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'report'
  return `${slug}-${format(report.generatedAt, 'yyyy-MM-dd')}.csv`
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function changeText(change: number | null) {
  if (change === null) return '<span style="color:#7b81a0">no prior data</span>'
  const positive = change >= 0
  const color = positive ? '#34d399' : '#f87171'
  return `<span style="color:${color}">${positive ? '+' : ''}${change}% vs prior period</span>`
}

export function reportToHtml(report: BuiltReport, viewUrl?: string) {
  const summary = report.summary
    .map(
      (metric) => `
      <td style="padding:12px 16px;border:1px solid #23294d;background:#141a3a">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#7b81a0">${escapeHtml(metric.label)}</div>
        <div style="font-size:22px;font-weight:700;color:#ffffff;margin:4px 0">${escapeHtml(metric.value)}</div>
        <div style="font-size:11px">${changeText(metric.change)}</div>
      </td>`,
    )
    .join('')

  const sections = report.sections
    .map((section) => {
      if (section.rows.length === 0) {
        return `
        <h3 style="color:#ffffff;font-size:15px;margin:28px 0 8px">${escapeHtml(section.title)}</h3>
        <p style="color:#7b81a0;font-size:13px;margin:0">${escapeHtml(section.empty)}</p>`
      }

      const head = section.columns
        .map(
          (column) =>
            `<th align="left" style="padding:8px 12px;border-bottom:1px solid #23294d;color:#7b81a0;font-size:11px;text-transform:uppercase;letter-spacing:.06em">${escapeHtml(column)}</th>`,
        )
        .join('')

      // Keep emails light; the web version shows the full table.
      const body = section.rows
        .slice(0, 10)
        .map(
          (row) =>
            `<tr>${row
              .map(
                (cell) =>
                  `<td style="padding:8px 12px;border-bottom:1px solid #1b2142;color:#e6e8f0;font-size:13px">${escapeHtml(cell)}</td>`,
              )
              .join('')}</tr>`,
        )
        .join('')

      const truncated =
        section.rows.length > 10
          ? `<p style="color:#7b81a0;font-size:12px;margin:8px 0 0">Showing 10 of ${section.rows.length} rows.</p>`
          : ''

      return `
      <h3 style="color:#ffffff;font-size:15px;margin:28px 0 8px">${escapeHtml(section.title)}</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>${truncated}`
    })
    .join('')

  const cta = viewUrl
    ? `<a href="${viewUrl}" style="display:inline-block;margin-top:28px;background:linear-gradient(90deg,#7c3aed,#06b6d4);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600">View full report</a>`
    : ''

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0a0e27;padding:32px;color:#e6e8f0">
    <div style="max-width:640px;margin:0 auto;background:#111634;border:1px solid #23294d;border-radius:14px;padding:32px">
      <h1 style="margin:0 0 4px;font-size:22px;color:#ffffff">${escapeHtml(report.name)}</h1>
      <p style="margin:0 0 24px;color:#7b81a0;font-size:13px">
        ${escapeHtml(report.typeLabel)} report for ${escapeHtml(report.workspaceName)} ·
        ${format(report.from, 'd MMM yyyy')} – ${format(report.to, 'd MMM yyyy')}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>${summary}</tr></table>
      ${sections}
      ${cta}
    </div>
  </div>`
}
