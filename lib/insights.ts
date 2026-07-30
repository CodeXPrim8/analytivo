import { prisma } from '@/lib/db'
import {
  getClickTrends,
  getDeviceBreakdown,
  getPeriodComparison,
  getTrafficSources,
} from '@/lib/analytics'
import { shortUrlFor } from '@/lib/links'

export type GeneratedInsight = {
  title: string
  description: string
  confidence: number
  actionItems: string[]
}

type InsightContext = {
  linkCount: number
  clickCount: number
  periodDays: number
  current: {
    totalClicks: number
    uniqueVisitors: number
    returningVisitors: number
    returnRate: number
  }
  previous: {
    totalClicks: number
    uniqueVisitors: number
    returningVisitors: number
    returnRate: number
  }
  changes: {
    totalClicks: number | null
    uniqueVisitors: number | null
    returningVisitors: number | null
    returnRate: number | null
  }
  sources: { source: string; clicks: number; percentage: number }[]
  devices: { device: string; clicks: number; percentage: number }[]
  trends: { date: string; clicks: number }[]
  topLinks: {
    title: string
    alias: string
    shortUrl: string
    clicks: number
    source: string
  }[]
}

async function buildInsightContext(userId: string): Promise<InsightContext> {
  const [period, sources, devices, trends, links, clickCount] = await Promise.all([
    getPeriodComparison(userId, 7),
    getTrafficSources(userId),
    getDeviceBreakdown(userId),
    getClickTrends(userId, 14),
    prisma.link.findMany({
      where: { userId },
      include: { _count: { select: { clicks: true } } },
      orderBy: { clicks: { _count: 'desc' } },
      take: 8,
    }),
    prisma.click.count({ where: { link: { userId } } }),
  ])

  return {
    linkCount: links.length,
    clickCount,
    periodDays: period.days,
    current: period.current,
    previous: period.previous,
    changes: period.changes,
    sources: sources.slice(0, 8),
    devices,
    trends,
    topLinks: links.map((link) => ({
      title: link.title,
      alias: link.alias,
      shortUrl: shortUrlFor(link.alias),
      clicks: link._count.clicks,
      source: link.source,
    })),
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function ruleBasedInsights(ctx: InsightContext): GeneratedInsight[] {
  const insights: GeneratedInsight[] = []

  if (ctx.clickCount === 0) {
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
    return insights
  }

  const topSource = ctx.sources[0]
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

  if (ctx.changes.totalClicks !== null) {
    const delta = ctx.changes.totalClicks
    insights.push({
      title:
        delta > 0
          ? `Clicks are up ${delta}% vs the prior ${ctx.periodDays} days`
          : delta < 0
            ? `Clicks are down ${Math.abs(delta)}% vs the prior ${ctx.periodDays} days`
            : 'Click volume is flat week over week',
      description: `Last ${ctx.periodDays} days: ${ctx.current.totalClicks} clicks (${ctx.current.uniqueVisitors} unique). Prior period: ${ctx.previous.totalClicks} clicks (${ctx.previous.uniqueVisitors} unique).`,
      confidence: 0.85,
      actionItems:
        delta < 0
          ? [
              'Re-share your strongest link on your top channel',
              'Test a new creative or title on the underperforming link',
              'Check whether posting time shifted away from your peak day',
            ]
          : [
              'Scale the same channel mix while volume is rising',
              'Clone your top link into a new campaign for the next drop',
              'Watch return rate so growth stays high-quality',
            ],
    })
  }

  const peak = ctx.trends.reduce(
    (best, day) => (day.clicks > best.clicks ? day : best),
    ctx.trends[0] || { date: '', clicks: 0 },
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

  const topDevice = ctx.devices[0]
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

  const topLink = ctx.topLinks[0]
  if (topLink && topLink.clicks > 0) {
    insights.push({
      title: `"${topLink.title}" is your best performer`,
      description: `${topLink.clicks} clicks via ${topLink.shortUrl}. Use this as the template for your next campaign creative.`,
      confidence: 0.78,
      actionItems: [
        'Reuse the same title style and thumbnail approach',
        `Create a channel-specific alias based on ${topLink.source || 'this link'}`,
        'Promote it again during your peak weekday',
      ],
    })
  }

  if (ctx.linkCount > 0 && ctx.linkCount < 3) {
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

  return insights.slice(0, 5)
}

function hasOpenAI() {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

async function callOpenAI(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const baseURL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${body.slice(0, 300)}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty OpenAI response')
  return content
}

function parseInsightsJson(raw: string): GeneratedInsight[] {
  const parsed = JSON.parse(raw) as {
    insights?: {
      title?: string
      description?: string
      confidence?: number
      actionItems?: string[]
    }[]
  }

  const list = Array.isArray(parsed.insights) ? parsed.insights : []
  return list
    .filter((i) => i.title && i.description)
    .slice(0, 5)
    .map((i) => ({
      title: String(i.title).slice(0, 120),
      description: String(i.description).slice(0, 600),
      confidence: Math.min(0.99, Math.max(0.4, Number(i.confidence) || 0.7)),
      actionItems: (Array.isArray(i.actionItems) ? i.actionItems : [])
        .map((a) => String(a).slice(0, 160))
        .filter(Boolean)
        .slice(0, 4),
    }))
}

async function generateAiInsights(ctx: InsightContext): Promise<GeneratedInsight[]> {
  const system = `You are Analytivo's video marketing strategist.
Analyze the user's short-link click analytics and return practical, specific recommendations.
Only use the provided data. Do not invent platforms, numbers, or links that are not present.
Focus on video marketing: which channel to push, when to post, device UX, underperforming links, and attribution hygiene.
Return JSON only in this shape:
{
  "insights": [
    {
      "title": "short headline",
      "description": "2-3 sentences with specific numbers from the data",
      "confidence": 0.0-1.0,
      "actionItems": ["concrete next step", "concrete next step", "concrete next step"]
    }
  ]
}
Return 3 to 5 insights, ranked by usefulness.`

  const user = `Here is the account analytics snapshot as JSON:\n${JSON.stringify(ctx, null, 2)}`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ])
  const insights = parseInsightsJson(raw)
  if (insights.length === 0) throw new Error('AI returned no insights')
  return insights
}

async function answerWithAi(ctx: InsightContext, question: string): Promise<string> {
  const system = `You are Analytivo's analytics copilot for video marketers.
Answer the user's question using ONLY the provided analytics JSON.
Be concise (3-6 sentences). Cite specific numbers. If data is insufficient, say what to measure next.
Return JSON: { "answer": "..." }`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    {
      role: 'user',
      content: `Question: ${question}\n\nAnalytics JSON:\n${JSON.stringify(ctx, null, 2)}`,
    },
  ])

  const parsed = JSON.parse(raw) as { answer?: string }
  if (!parsed.answer?.trim()) throw new Error('AI returned an empty answer')
  return parsed.answer.trim()
}

function answerFromRules(ctx: InsightContext, question: string): string {
  const q = question.toLowerCase()
  const topSource = ctx.sources[0]
  const topDevice = ctx.devices[0]
  const topLink = ctx.topLinks[0]

  if (ctx.clickCount === 0) {
    return 'You do not have click data yet. Create a short link, share it, then ask again once traffic arrives.'
  }

  if (q.includes('channel') || q.includes('source') || q.includes('where')) {
    return topSource
      ? `Your strongest channel right now is ${topSource.source} with ${topSource.clicks} clicks (${topSource.percentage}% of traffic). Prioritize that channel for the next drop.`
      : 'Traffic sources are still thin. Share links with utm_source tags so attribution is clearer.'
  }

  if (q.includes('device') || q.includes('mobile') || q.includes('desktop')) {
    return topDevice
      ? `${capitalize(topDevice.device)} accounts for ${topDevice.percentage}% of clicks. Optimize titles and landing experience for that device first.`
      : 'No device breakdown yet. Collect a few more clicks and ask again.'
  }

  if (q.includes('best') || q.includes('top') || q.includes('performing')) {
    return topLink
      ? `"${topLink.title}" leads with ${topLink.clicks} clicks (${topLink.shortUrl}). Reuse that creative pattern on your next campaign.`
      : 'No clear winner yet. Create a few channel-specific links and compare after 48 hours.'
  }

  if (q.includes('trend') || q.includes('up') || q.includes('down') || q.includes('grow')) {
    const delta = ctx.changes.totalClicks
    if (delta === null) {
      return `Last ${ctx.periodDays} days had ${ctx.current.totalClicks} clicks. There is not enough prior-period data for a clean comparison yet.`
    }
    return `Clicks are ${delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'} ${Math.abs(delta)}% vs the prior ${ctx.periodDays} days (${ctx.current.totalClicks} vs ${ctx.previous.totalClicks}).`
  }

  const fallback = ruleBasedInsights(ctx)[0]
  return fallback?.description || 'Share more links to unlock deeper answers.'
}

async function persistInsights(userId: string, insights: GeneratedInsight[]) {
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

export async function generateInsightsForUser(userId: string) {
  const ctx = await buildInsightContext(userId)

  let insights: GeneratedInsight[]
  if (hasOpenAI() && ctx.clickCount > 0) {
    try {
      insights = await generateAiInsights(ctx)
    } catch {
      insights = ruleBasedInsights(ctx)
    }
  } else {
    insights = ruleBasedInsights(ctx)
  }

  return persistInsights(userId, insights)
}

export async function answerInsightQuestion(userId: string, question: string) {
  const ctx = await buildInsightContext(userId)

  if (hasOpenAI()) {
    try {
      const answer = await answerWithAi(ctx, question)
      return { answer, provider: 'openai' as const }
    } catch {
      return { answer: answerFromRules(ctx, question), provider: 'rules' as const }
    }
  }

  return { answer: answerFromRules(ctx, question), provider: 'rules' as const }
}

export function insightsProviderLabel() {
  return hasOpenAI() ? 'openai' : 'rules'
}
