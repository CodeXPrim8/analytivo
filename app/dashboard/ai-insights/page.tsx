import { requireWorkspace } from '@/lib/workspace'
import { prisma } from '@/lib/db'
import { generateInsightsForUser, insightsProviderLabel } from '@/lib/insights'
import { AIInsightsPanel } from '@/components/AIInsightsPanel'

export default async function AIInsightsPage() {
  const ctx = await requireWorkspace()
  let insights = await prisma.insight.findMany({
    where: { userId: ctx.ownerId },
    orderBy: { createdAt: 'desc' },
  })

  if (insights.length === 0) {
    insights = await generateInsightsForUser(ctx.ownerId, ctx.user.id)
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
