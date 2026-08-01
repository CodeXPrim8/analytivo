import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { emailEnabled } from '@/lib/email'
import { buildReport, normalizeType, parseRecipients } from '@/lib/reports'
import { requireWorkspace, roleAtLeast } from '@/lib/workspace'
import { ReportView } from '@/components/ReportView'

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireWorkspace()

  const report = await prisma.report.findFirst({
    where: { id, userId: ctx.ownerId },
  })
  if (!report) notFound()

  const built = await buildReport(ctx.ownerId, {
    name: report.name,
    type: normalizeType(report.type),
    rangeDays: report.rangeDays,
    workspaceName: ctx.workspaceName,
  })

  return (
    <ReportView
      reportId={report.id}
      report={{
        name: built.name,
        typeLabel: built.typeLabel,
        rangeDays: built.rangeDays,
        from: built.from,
        to: built.to,
        generatedAt: built.generatedAt,
        workspaceName: built.workspaceName,
        summary: built.summary,
        sections: built.sections,
        hasData: built.hasData,
      }}
      recipients={parseRecipients(report.recipients)}
      schedule={report.schedule}
      lastSentAt={report.lastSentAt}
      canSend={roleAtLeast(ctx.role, 'editor')}
      emailConfigured={emailEnabled()}
    />
  )
}
