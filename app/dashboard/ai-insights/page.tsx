import { requireWorkspace } from '@/lib/workspace'
import { prisma } from '@/lib/db'
import { generateInsightsForUser, insightsProviderLabel } from '@/lib/insights'
import { AIInsightsPanel } from '@/components/AIInsightsPanel'
import { UpgradeNotice } from '@/components/UpgradeNotice'

export default async function AIInsightsPage() {
  const ctx = await requireWorkspace()

  // Gate before generating, so a free workspace never spends an AI call.
  if (!ctx.capabilities.aiInsights) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Insights</h1>
          <p className="text-muted-foreground">
            Recommendations drawn from your own click data
          </p>
        </div>
        <UpgradeNotice
          title="AI insights are a Pro feature"
          description="Pro analyses your traffic sources, devices, peak days and best performing links, then suggests what to do next. You can also ask questions about your own numbers."
          isOwner={ctx.isOwner}
        />
      </div>
    )
  }

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
