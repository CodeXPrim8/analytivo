import { format, subDays, startOfDay } from 'date-fns'
import { prisma } from '@/lib/db'
import { shortUrlFor } from '@/lib/links'

export async function getLinkStats(userId: string, linkIds?: string[]) {
  const where = {
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
  const clicks = await prisma.click.findMany({
    where: { link: { userId } },
    select: { source: true },
  })
  const counts = new Map<string, number>()
  for (const c of clicks) {
    const source = c.source || 'direct'
    counts.set(source, (counts.get(source) || 0) + 1)
  }
  const total = clicks.length || 1
  return Array.from(counts.entries())
    .map(([source, clicks]) => ({
      source,
      clicks,
      percentage: Math.round((clicks / total) * 100),
    }))
    .sort((a, b) => b.clicks - a.clicks)
}

export async function getDeviceBreakdown(userId: string) {
  const clicks = await prisma.click.findMany({
    where: { link: { userId } },
    select: { device: true },
  })
  const counts = new Map<string, number>()
  for (const c of clicks) {
    const device = c.device || 'desktop'
    counts.set(device, (counts.get(device) || 0) + 1)
  }
  const total = clicks.length || 1
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
  const links = await prisma.link.findMany({
    where: { userId },
    include: { _count: { select: { clicks: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const stats = await getLinkStats(userId)
  const clickTrends = await getClickTrends(userId)
  const trafficSources = await getTrafficSources(userId)
  const deviceBreakdown = await getDeviceBreakdown(userId)

  const uniqueByLink = await Promise.all(
    links.slice(0, 5).map(async (link) => {
      const unique = await prisma.click.groupBy({
        by: ['visitorId'],
        where: { linkId: link.id },
      })
      return serializeLink(link, unique.length)
    }),
  )

  const top = links.slice().sort((a, b) => b._count.clicks - a._count.clicks)[0]
  const topUnique = top
    ? (
        await prisma.click.groupBy({
          by: ['visitorId'],
          where: { linkId: top.id },
        })
      ).length
    : 0

  const conversionRate =
    stats.uniqueVisitors > 0
      ? Math.round((stats.returningVisitors / stats.uniqueVisitors) * 1000) / 10
      : 0

  return {
    totalClicks: stats.totalClicks,
    uniqueVisitors: stats.uniqueVisitors,
    returningVisitors: stats.returningVisitors,
    conversionRate,
    topLink: top ? await serializeLink(top, topUnique) : undefined,
    recentLinks: uniqueByLink,
    clickTrends,
    trafficSources,
    deviceBreakdown,
  }
}
