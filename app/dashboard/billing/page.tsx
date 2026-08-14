import { redirect } from 'next/navigation'
import { startOfMonth } from 'date-fns'
import { requireWorkspace } from '@/lib/workspace'
import { prisma } from '@/lib/db'
import { PUBLIC_PLANS } from '@/lib/plans'
import { paystackEnabled, purchasablePlans } from '@/lib/paystack'
import { opayEnabled, opayPurchasablePlans } from '@/lib/opay'
import { BillingPanel } from '@/components/BillingPanel'

export default async function BillingPage() {
  const ctx = await requireWorkspace()
  // Billing belongs to the account that owns the workspace.
  if (!ctx.isOwner) redirect('/dashboard')

  const [linksThisMonth, campaignsCreated, teamMembers, suspendedMembers, owner] =
    await Promise.all([
      prisma.link.count({
        where: { userId: ctx.ownerId, createdAt: { gte: startOfMonth(new Date()) } },
      }),
      prisma.campaign.count({ where: { userId: ctx.ownerId } }),
      prisma.teamMember.count({
        where: { userId: ctx.ownerId, status: { in: ['pending', 'active'] } },
      }),
      prisma.teamMember.count({ where: { userId: ctx.ownerId, status: 'suspended' } }),
      prisma.user.findUnique({
        where: { id: ctx.ownerId },
        select: {
          subscriptionStatus: true,
          subscriptionPlan: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          billingProvider: true,
        },
      }),
    ])

  const providers = [
    ...(paystackEnabled() ? (['paystack'] as const) : []),
    ...(opayEnabled() ? (['opay'] as const) : []),
  ]

  return (
    <BillingPanel
      currentPlan={ctx.plan}
      usage={{
        linksThisMonth,
        linkLimit: ctx.capabilities.linksPerMonth,
        campaignsCreated,
        seatsUsed: teamMembers + 1,
        seatLimit: ctx.capabilities.teamSeats,
        suspendedMembers,
      }}
      subscription={{
        status: owner?.subscriptionStatus || 'none',
        paidPlan: owner?.subscriptionPlan || null,
        currentPeriodEnd: owner?.currentPeriodEnd || null,
        cancelAtPeriodEnd: owner?.cancelAtPeriodEnd || false,
        provider: owner?.billingProvider || null,
      }}
      plans={PUBLIC_PLANS}
      providers={[...providers]}
      purchasableByProvider={{
        paystack: purchasablePlans(),
        opay: opayPurchasablePlans(),
      }}
      showTestControls={process.env.NODE_ENV !== 'production'}
    />
  )
}
