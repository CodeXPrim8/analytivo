import { prisma } from '@/lib/db'
import { createNotifications } from '@/lib/notifications'
import { PLAN_NAMES, capabilitiesFor, normalizePlan, type PlanId } from '@/lib/plans'

export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled'

const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, business: 2 }

/** Seats include the owner, so this is how many invited people may have access. */
function memberAllowanceFor(plan: PlanId) {
  return Math.max(capabilitiesFor(plan).teamSeats - 1, 0)
}

/**
 * Drops the newest members over the seat allowance to "suspended".
 *
 * Seat limits were previously only checked when inviting, so a workspace that
 * downgraded kept every member it had already added. Suspending rather than
 * deleting means an upgrade can hand access straight back.
 */
export async function reconcileSeats(ownerId: string, plan: PlanId) {
  const allowance = memberAllowanceFor(plan)

  const members = await prisma.teamMember.findMany({
    where: { userId: ownerId, status: { in: ['pending', 'active'] } },
    // Longest-standing members keep their seat; unaccepted invites go first
    // because acceptedAt is null and Postgres sorts nulls last ascending.
    orderBy: [{ acceptedAt: 'asc' }, { invitedAt: 'asc' }],
    select: { id: true, name: true },
  })

  if (members.length <= allowance) return { suspended: 0 }

  const excess = members.slice(allowance)
  await prisma.teamMember.updateMany({
    where: { id: { in: excess.map((member) => member.id) } },
    data: { status: 'suspended' },
  })

  return { suspended: excess.length }
}

/** Gives suspended members their seats back, oldest first, after an upgrade. */
export async function restoreSeats(ownerId: string, plan: PlanId) {
  const allowance = memberAllowanceFor(plan)

  const active = await prisma.teamMember.count({
    where: { userId: ownerId, status: { in: ['pending', 'active'] } },
  })
  const room = allowance - active
  if (room <= 0) return { restored: 0 }

  const suspended = await prisma.teamMember.findMany({
    where: { userId: ownerId, status: 'suspended' },
    orderBy: [{ acceptedAt: 'asc' }, { invitedAt: 'asc' }],
    take: room,
    select: { id: true, memberUserId: true, acceptedAt: true },
  })

  for (const member of suspended) {
    await prisma.teamMember.update({
      where: { id: member.id },
      // Someone who never accepted returns to a pending invite, not to access.
      data: { status: member.memberUserId && member.acceptedAt ? 'active' : 'pending' },
    })
  }

  return { restored: suspended.length }
}

/**
 * The single place a workspace's entitlement changes. Callers are the Paystack
 * webhook and the billing sweep — never a plain user action, because neither a
 * form post nor a success redirect proves that money moved.
 */
export async function applyPlanChange(
  ownerId: string,
  nextPlan: PlanId,
  options: { reason: string; notify?: boolean } = { reason: 'billing update' },
) {
  const current = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { plan: true },
  })
  if (!current) return { changed: false, suspended: 0 }

  const previous = normalizePlan(current.plan)
  if (previous === nextPlan) return { changed: false, suspended: 0 }

  await prisma.user.update({ where: { id: ownerId }, data: { plan: nextPlan } })

  const downgrade = PLAN_RANK[nextPlan] < PLAN_RANK[previous]
  const { suspended } = downgrade
    ? await reconcileSeats(ownerId, nextPlan)
    : { suspended: 0 }
  if (!downgrade) await restoreSeats(ownerId, nextPlan)

  if (options.notify !== false) {
    const seatNote = suspended
      ? ` ${suspended} team member${suspended === 1 ? '' : 's'} lost access because the plan includes fewer seats.`
      : ''
    await createNotifications(ownerId, [
      {
        title: downgrade
          ? `Workspace moved to ${PLAN_NAMES[nextPlan]}`
          : `Workspace upgraded to ${PLAN_NAMES[nextPlan]}`,
        body: `${options.reason}.${seatNote}`,
        type: 'billing',
        href: '/dashboard/billing',
      },
    ])
  }

  return { changed: true, suspended, previous }
}

/**
 * Access outlives a cancellation or a failed charge until the paid period ends,
 * so a card that declines on renewal day does not lock someone out mid-month.
 */
export function entitlementFor(state: {
  subscriptionStatus: string
  subscriptionPlan?: string | null
  currentPeriodEnd?: Date | null
  now?: Date
}): PlanId {
  const now = state.now ?? new Date()
  const paidPlan = normalizePlan(state.subscriptionPlan)
  if (paidPlan === 'free') return 'free'

  if (state.subscriptionStatus === 'active') return paidPlan
  if (state.subscriptionStatus === 'past_due' || state.subscriptionStatus === 'canceled') {
    const until = state.currentPeriodEnd
    return until && until.getTime() > now.getTime() ? paidPlan : 'free'
  }
  return 'free'
}
