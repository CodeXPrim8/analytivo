import { requireWorkspace, roleAtLeast } from '@/lib/workspace'
import { prisma } from '@/lib/db'
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
      initialReports={reports.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        createdAt: r.createdAt,
      }))}
    />
  )
}
