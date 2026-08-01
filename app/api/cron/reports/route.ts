import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { capabilitiesFor } from '@/lib/plans'
import { deliverReport } from '@/lib/report-delivery'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Cron runs daily, so a report is due once its interval has elapsed. */
const INTERVAL_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
}

// Half a day of slack keeps a run that starts slightly early from skipping a cycle.
const TOLERANCE_MS = 12 * 60 * 60 * 1000

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reports = await prisma.report.findMany({
    where: { schedule: { in: Object.keys(INTERVAL_DAYS) } },
    include: { user: { select: { workspaceName: true, plan: true } } },
  })

  const now = Date.now()
  const results: { id: string; status: string; detail?: string }[] = []

  for (const report of reports) {
    const intervalDays = INTERVAL_DAYS[report.schedule || '']
    if (!intervalDays) continue

    // A downgrade after scheduling must stop delivery.
    if (!capabilitiesFor(report.user.plan).reportDelivery) {
      results.push({ id: report.id, status: 'skipped', detail: 'plan does not include delivery' })
      continue
    }

    const dueAfter = intervalDays * 24 * 60 * 60 * 1000 - TOLERANCE_MS
    if (report.lastSentAt && now - report.lastSentAt.getTime() < dueAfter) {
      results.push({ id: report.id, status: 'skipped' })
      continue
    }

    try {
      const delivery = await deliverReport(
        {
          id: report.id,
          name: report.name,
          type: report.type,
          rangeDays: report.rangeDays,
          linkIds: report.linkIds,
          recipients: report.recipients,
          userId: report.userId,
        },
        report.user.workspaceName,
      )

      results.push(
        delivery.ok
          ? { id: report.id, status: 'sent', detail: `${delivery.sent} recipient(s)` }
          : { id: report.id, status: 'failed', detail: delivery.error },
      )
    } catch (error) {
      // One bad report must not stop the rest of the run.
      results.push({
        id: report.id,
        status: 'failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({
    checked: reports.length,
    sent: results.filter((r) => r.status === 'sent').length,
    results,
  })
}
