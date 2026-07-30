import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { generateInsightsForUser, insightsProviderLabel } from '@/lib/insights'
import { AIInsightsPanel } from '@/components/AIInsightsPanel'

export default async function AIInsightsPage() {
  const user = await requireUser()
  let insights = await prisma.insight.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  if (insights.length === 0) {
    insights = await generateInsightsForUser(user.id)
  }

  return (
    <AIInsightsPanel
      provider={insightsProviderLabel()}
      initialInsights={insights.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        confidence: i.confidence,
        actionItems: JSON.parse(i.actionItems) as string[],
        createdAt: i.createdAt,
      }))}
    />
  )
}
