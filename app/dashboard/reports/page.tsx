import { requireWorkspace, roleAtLeast } from '@/lib/workspace'
import { prisma } from '@/lib/db'
import { emailEnabled } from '@/lib/email'
import { ReportsManager } from '@/components/ReportsManager'

export default async function ReportsPage() {
  const ctx = await requireWorkspace()
  const reports = await prisma.report.findMany({
    where: { userId: ctx.ownerId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <ReportsManager
      canEdit={roleAtLeast(ctx.role, 'editor')}
      emailConfigured={emailEnabled()}
      initialReports={reports.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        rangeDays: r.rangeDays,
        schedule: r.schedule,
        recipients: r.recipients,
        lastSentAt: r.lastSentAt,
        createdAt: r.createdAt,
      }))}
    />
  )
}
