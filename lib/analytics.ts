import { format, subDays, startOfDay } from 'date-fns'
import { prisma } from '@/lib/db'
import { shortUrlFor } from '@/lib/links'

export async function getLinkStats(
  userId: string,
  linkIds?: string[],
  range?: { from: Date; to?: Date },
) {
  const where = {
    ...(range
      ? {
          createdAt: {
            gte: range.from,
            ...(range.to ? { lt: range.to } : {}),
          },
        }
      : {}),
    link: {
      userId,
      ...(linkIds ? { id: { in: linkIds } } : {}),
    },
  }

  const [totalClicks, uniqueVisitors, returningVisitors] = await Promise.all([
    prisma.click.count({ where }),
    prisma.click.groupBy({ by: ['visitorId'], where }).then((r) => r.length),
    prisma.click.count({ where: { ...where, isReturning: true } }),
  ])

  return { totalClicks, uniqueVisitors, returningVisitors }
}

/** Percent change from previous → current. Null when there is nothing to compare. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return 100
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/** Last `days` vs the `days` before that (e.g. last 7 vs prior 7). */
export async function getPeriodComparison(userId: string, days = 7) {
  const now = new Date()
  const currentFrom = startOfDay(subDays(now, days - 1))
  const previousFrom = startOfDay(subDays(now, days * 2 - 1))

  const [current, previous] = await Promise.all([
    getLinkStats(userId, undefined, { from: currentFrom }),
    getLinkStats(userId, undefined, { from: previousFrom, to: currentFrom }),
  ])

  const currentReturnRate =
    current.uniqueVisitors > 0
      ? Math.round((current.returningVisitors / current.uniqueVisitors) * 1000) / 10
      : 0
  const previousReturnRate =
    previous.uniqueVisitors > 0
      ? Math.round((previous.returningVisitors / previous.uniqueVisitors) * 1000) / 10
      : 0

  return {
    days,
    current: { ...current, returnRate: currentReturnRate },
    previous: { ...previous, returnRate: previousReturnRate },
    changes: {
      totalClicks: percentChange(current.totalClicks, previous.totalClicks),
      uniqueVisitors: percentChange(current.uniqueVisitors, previous.uniqueVisitors),
      returningVisitors: percentChange(current.returningVisitors, previous.returningVisitors),
      returnRate: percentChange(currentReturnRate, previousReturnRate),
    },
  }
}

export async function getClickTrends(userId: string, days = 14) {
  const since = startOfDay(subDays(new Date(), days - 1))
  const clicks = await prisma.click.findMany({
    where: {
      createdAt: { gte: since },
      link: { userId },
    },
    select: { createdAt: true },
  })

  const map = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    map.set(format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd'), 0)
  }
  for (const click of clicks) {
    const key = format(click.createdAt, 'yyyy-MM-dd')
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1)
  }

  return Array.from(map.entries()).map(([date, clicks]) => ({ date, clicks }))
}

export async function getTrafficSources(userId: string) {
  const grouped = await prisma.click.groupBy({
    by: ['source'],
    where: { link: { userId } },
    _count: { _all: true },
  })
  const counts = new Map<string, number>()
  for (const g of grouped) {
    const source = g.source || 'direct'
    counts.set(source, (counts.get(source) || 0) + g._count._all)
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1
  return Array.from(counts.entries())
    .map(([source, clicks]) => ({
      source,
      clicks,
      percentage: Math.round((clicks / total) * 100),
    }))
    .sort((a, b) => b.clicks - a.clicks)
}

export async function getDeviceBreakdown(userId: string) {
  const grouped = await prisma.click.groupBy({
    by: ['device'],
    where: { link: { userId } },
    _count: { _all: true },
  })
  const counts = new Map<string, number>()
  for (const g of grouped) {
    const device = g.device || 'desktop'
    counts.set(device, (counts.get(device) || 0) + g._count._all)
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1
  return Array.from(counts.entries())
    .map(([device, clicks]) => ({
      device,
      clicks,
      percentage: Math.round((clicks / total) * 100),
    }))
    .sort((a, b) => b.clicks - a.clicks)
}

export async function serializeLink(
  link: {
    id: string
    title: string
    alias: string
    originalUrl: string
    source: string
    campaignId: string | null
    createdAt: Date
    updatedAt: Date
    _count?: { clicks: number }
  },
  uniqueClicks = 0,
) {
  return {
    id: link.id,
    title: link.title,
    shortUrl: shortUrlFor(link.alias),
    originalUrl: link.originalUrl,
    clickCount: link._count?.clicks ?? 0,
    uniqueClicks,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    campaignId: link.campaignId || undefined,
    source: link.source,
  }
}

export async function getDashboardOverview(userId: string) {
  // All independent queries run in parallel; aggregation happens in the DB.
  const [recent, top, stats, clickTrends, trafficSources, deviceBreakdown, period] =
    await Promise.all([
      prisma.link.findMany({
        where: { userId },
        include: { _count: { select: { clicks: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.link.findFirst({
        where: { userId },
        include: { _count: { select: { clicks: true } } },
        orderBy: { clicks: { _count: 'desc' } },
      }),
      getLinkStats(userId),
      getClickTrends(userId),
      getTrafficSources(userId),
      getDeviceBreakdown(userId),
      getPeriodComparison(userId, 7),
    ])

  const linkIds = Array.from(new Set([...recent.map((l) => l.id), ...(top ? [top.id] : [])]))
  const uniqueRows = linkIds.length
    ? await prisma.click.groupBy({
        by: ['linkId', 'visitorId'],
        where: { linkId: { in: linkIds } },
      })
    : []
  const uniqueByLinkId = new Map<string, number>()
  for (const row of uniqueRows) {
    uniqueByLinkId.set(row.linkId, (uniqueByLinkId.get(row.linkId) || 0) + 1)
  }

  const recentLinks = await Promise.all(
    recent.map((link) => serializeLink(link, uniqueByLinkId.get(link.id) || 0)),
  )

  const conversionRate =
    stats.uniqueVisitors > 0
      ? Math.round((stats.returningVisitors / stats.uniqueVisitors) * 1000) / 10
      : 0

  return {
    totalClicks: stats.totalClicks,
    uniqueVisitors: stats.uniqueVisitors,
    returningVisitors: stats.returningVisitors,
    conversionRate,
    changes: period.changes,
    changeLabel: `vs prior ${period.days} days`,
    topLink: top ? await serializeLink(top, uniqueByLinkId.get(top.id) || 0) : undefined,
    recentLinks,
    clickTrends,
    trafficSources,
    deviceBreakdown,
  }
}
