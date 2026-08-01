import { startOfMonth } from 'date-fns'
import { requireWorkspace, roleAtLeast } from '@/lib/workspace'
import { prisma } from '@/lib/db'
import { serializeLink } from '@/lib/analytics'
import { LinksManager } from '@/components/LinksManager'

export default async function LinksPage() {
  const ctx = await requireWorkspace()
  const rows = await prisma.link.findMany({
    where: { userId: ctx.ownerId },
    include: { _count: { select: { clicks: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const campaigns = await prisma.campaign.findMany({
    where: { userId: ctx.ownerId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  const links = await Promise.all(
    rows.map(async (link) => {
      const unique = await prisma.click.groupBy({
        by: ['visitorId'],
        where: { linkId: link.id },
      })
      return serializeLink(link, unique.length)
    }),
  )

  const limit = ctx.capabilities.linksPerMonth
  const quota =
    limit === null
      ? null
      : {
          limit,
          used: await prisma.link.count({
            where: { userId: ctx.ownerId, createdAt: { gte: startOfMonth(new Date()) } },
          }),
        }

  return (
    <LinksManager
      initialLinks={links}
      campaigns={campaigns}
      canEdit={roleAtLeast(ctx.role, 'editor')}
      quota={quota}
      isOwner={ctx.isOwner}
    />
  )
}
