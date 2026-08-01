import { requireWorkspace, roleAtLeast } from '@/lib/workspace'
import { prisma } from '@/lib/db'
import { emailEnabled } from '@/lib/email'
import { ReportsManager } from '@/components/ReportsManager'

export default async function ReportsPage() {
  const ctx = await requireWorkspace()
  const [reports, links] = await Promise.all([
    prisma.report.findMany({
      where: { userId: ctx.ownerId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.link.findMany({
      where: { userId: ctx.ownerId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, alias: true },
    }),
  ])

  // Reports store link ids, so the list needs titles to describe each scope.
  const titleById = new Map(links.map((link) => [link.id, link.title || 'Untitled link']))

  return (
    <ReportsManager
      canEdit={roleAtLeast(ctx.role, 'editor')}
      canSchedule={ctx.capabilities.reportDelivery}
      isOwner={ctx.isOwner}
      emailConfigured={emailEnabled()}
      links={links.map((link) => ({
        id: link.id,
        title: link.title || 'Untitled link',
        alias: link.alias,
      }))}
      initialReports={reports.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        rangeDays: r.rangeDays,
        schedule: r.schedule,
        recipients: r.recipients,
        lastSentAt: r.lastSentAt,
        createdAt: r.createdAt,
        scoped: r.linkIds !== '',
        scopeTitles: r.linkIds
          .split(',')
          .filter(Boolean)
          .map((id) => titleById.get(id))
          .filter((title): title is string => Boolean(title)),
      }))}
    />
  )
}
