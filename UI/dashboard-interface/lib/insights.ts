import { prisma } from '@/lib/db'
import { getClickTrends, getDeviceBreakdown, getTrafficSources } from '@/lib/analytics'

export async function generateInsightsForUser(userId: string) {
  const [trends, sources, devices, linkCount, clickCount] = await Promise.all([
    getClickTrends(userId, 7),
    getTrafficSources(userId),
    getDeviceBreakdown(userId),
    prisma.link.count({ where: { userId } }),
    prisma.click.count({ where: { link: { userId } } }),
  ])

  const insights: {
    title: string
    description: string
    confidence: number
    actionItems: string[]
  }[] = []

  if (clickCount === 0) {
    insights.push({
      title: 'Start tracking your first video link',
      description:
        'You have not recorded any clicks yet. Create an Analytivo link, share it on WhatsApp or social, then return here for audience insights.',
      confidence: 0.95,
      actionItems: [
        'Create a link from the Links page',
        'Share it on at least one channel',
        'Check Analytics after the first clicks arrive',
      ],
    })
  } else {
    const topSource = sources[0]
    if (topSource) {
      insights.push({
        title: `${capitalize(topSource.source)} is your top traffic source`,
        description: `${topSource.source} drove ${topSource.percentage}% of clicks (${topSource.clicks} total). Double down on what already works before expanding to weaker channels.`,
        confidence: Math.min(0.95, 0.55 + topSource.percentage / 100),
        actionItems: [
          `Share your next video primarily on ${topSource.source}`,
          'Create a campaign-specific alias for that channel',
          'Compare performance after 48 hours',
        ],
      })
    }

    const peak = trends.reduce(
      (best, day) => (day.clicks > best.clicks ? day : best),
      trends[0] || { date: '', clicks: 0 },
    )
    if (peak && peak.clicks > 0) {
      insights.push({
        title: 'Peak click day detected',
        description: `Your busiest recent day was ${peak.date} with ${peak.clicks} clicks. Schedule important shares around similar windows.`,
        confidence: 0.72,
        actionItems: [
          'Plan your next campaign drop for a similar weekday',
          'Avoid low-traffic days for launches',
          'Enable a QR code for offline promotion',
        ],
      })
    }

    const topDevice = devices[0]
    if (topDevice) {
      insights.push({
        title: `${capitalize(topDevice.device)} dominates your audience`,
        description: `${topDevice.percentage}% of visitors used ${topDevice.device}. Optimize previews and CTAs for that experience.`,
        confidence: 0.7,
        actionItems: [
          `Preview your destination video on ${topDevice.device}`,
          'Keep titles short for mobile readers',
          'Test QR codes if desktop share is weak',
        ],
      })
    }
  }

  if (linkCount > 0 && linkCount < 3) {
    insights.push({
      title: 'Create more campaign-specific links',
      description:
        'Separate aliases per channel make attribution clear. One link for WhatsApp and another for Instagram usually reveals which community converts.',
      confidence: 0.8,
      actionItems: [
        'Create one link per major channel',
        'Tag each link with a source label',
        'Group them under a campaign',
      ],
    })
  }

  await prisma.insight.deleteMany({ where: { userId } })
  await prisma.insight.createMany({
    data: insights.map((insight) => ({
      userId,
      title: insight.title,
      description: insight.description,
      confidence: insight.confidence,
      actionItems: JSON.stringify(insight.actionItems),
    })),
  })

  return prisma.insight.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
