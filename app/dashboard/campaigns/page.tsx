import { requireWorkspace, roleAtLeast } from '@/lib/workspace'
import { prisma } from '@/lib/db'
import { CampaignsManager } from '@/components/CampaignsManager'

export default async function CampaignsPage() {
  const ctx = await requireWorkspace()
  const campaigns = await prisma.campaign.findMany({
    where: { userId: ctx.ownerId },
    include: {
      links: { include: { _count: { select: { clicks: true } } } },
      _count: { select: { links: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const serialized = await Promise.all(
    campaigns.map(async (campaign) => {
      const linkIds = campaign.links.map((l) => l.id)
      const totalClicks = campaign.links.reduce((sum, l) => sum + l._count.clicks, 0)
      const uniqueVisitors =
        linkIds.length === 0
          ? 0
          : (
              await prisma.click.groupBy({
                by: ['visitorId'],
                where: { linkId: { in: linkIds } },
              })
            ).length

      return {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description || undefined,
        status: campaign.status as 'active' | 'paused' | 'completed',
        totalClicks,
        uniqueVisitors,
        linkCount: campaign._count.links,
        startDate: campaign.startDate,
      }
    }),
  )

  return (
    <CampaignsManager
      initialCampaigns={serialized}
      canEdit={roleAtLeast(ctx.role, 'editor')}
    />
  )
}
