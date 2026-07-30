import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { serializeLink } from '@/lib/analytics'
import { LinksManager } from '@/components/LinksManager'

export default async function LinksPage() {
  const user = await requireUser()
  const rows = await prisma.link.findMany({
    where: { userId: user.id },
    include: { _count: { select: { clicks: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
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

  return <LinksManager initialLinks={links} campaigns={campaigns} />
}
