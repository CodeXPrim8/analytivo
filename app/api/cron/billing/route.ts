import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { applyPlanChange, entitlementFor } from '@/lib/billing'
import { normalizePlan } from '@/lib/plans'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Ends grace periods. A cancelled or past-due subscription keeps its plan until
 * `currentPeriodEnd`, and nothing else is watching the clock, so this sweep is
 * what actually removes access once the paid time is used up.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const lapsed = await prisma.user.findMany({
    where: {
      plan: { not: 'free' },
      subscriptionStatus: { in: ['past_due', 'canceled'] },
      currentPeriodEnd: { lt: now },
    },
    select: {
      id: true,
      plan: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      currentPeriodEnd: true,
    },
  })

  const results: { id: string; from: string; to: string; suspendedSeats: number }[] = []

  for (const user of lapsed) {
    const entitlement = entitlementFor({ ...user, now })
    if (entitlement === normalizePlan(user.plan)) continue

    try {
      const change = await applyPlanChange(user.id, entitlement, {
        reason: 'The paid period ended without a renewal',
      })
      results.push({
        id: user.id,
        from: normalizePlan(user.plan),
        to: entitlement,
        suspendedSeats: change.suspended,
      })
    } catch (error) {
      // One bad workspace must not stop the sweep.
      console.error('[billing] could not downgrade', user.id, error)
    }
  }

  return NextResponse.json({ checked: lapsed.length, downgraded: results.length, results })
}
