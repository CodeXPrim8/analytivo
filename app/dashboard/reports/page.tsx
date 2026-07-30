import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { ReportsManager } from '@/components/ReportsManager'

export default async function ReportsPage() {
  const user = await requireUser()
  const reports = await prisma.report.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <ReportsManager
      initialReports={reports.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        createdAt: r.createdAt,
      }))}
    />
  )
}
