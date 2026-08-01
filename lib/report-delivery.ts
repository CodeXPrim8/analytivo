import { format } from 'date-fns'
import { prisma } from '@/lib/db'
import { emailEnabled, sendEmail } from '@/lib/email'
import { appBaseUrl } from '@/lib/links'
import {
  buildReport,
  normalizeType,
  parseLinkIds,
  parseRecipients,
  reportToHtml,
} from '@/lib/reports'

export type DeliverableReport = {
  id: string
  name: string
  type: string
  rangeDays: number
  linkIds: string
  recipients: string
  userId: string
}

/**
 * Builds a report and emails it to its recipients.
 * Shared by the "Send now" action and the scheduled cron run.
 */
export async function deliverReport(report: DeliverableReport, workspaceName: string) {
  const recipients = parseRecipients(report.recipients)
  if (recipients.length === 0) {
    return { ok: false as const, error: 'This report has no recipients yet.' }
  }
  if (!emailEnabled()) {
    return { ok: false as const, error: 'Email delivery is not configured.' }
  }

  const built = await buildReport(report.userId, {
    name: report.name,
    type: normalizeType(report.type),
    rangeDays: report.rangeDays,
    linkIds: parseLinkIds(report.linkIds),
    workspaceName,
  })

  const html = reportToHtml(built, `${appBaseUrl()}/dashboard/reports/${report.id}`)
  const subject = `${report.name} · ${format(built.from, 'd MMM')} – ${format(built.to, 'd MMM yyyy')}`

  let sent = 0
  let lastError: string | undefined
  for (const to of recipients) {
    const result = await sendEmail({ to, subject, html })
    if (result.ok) sent += 1
    else lastError = result.error
  }

  if (sent === 0) {
    return { ok: false as const, error: lastError || 'Could not send this report.' }
  }

  await prisma.report.update({
    where: { id: report.id },
    data: { lastSentAt: new Date() },
  })

  return { ok: true as const, sent }
}
