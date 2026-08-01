import { redirect } from 'next/navigation'
import { startOfMonth } from 'date-fns'
import { requireWorkspace } from '@/lib/workspace'
import { prisma } from '@/lib/db'
import { PUBLIC_PLANS } from '@/lib/plans'
import { BillingPanel } from '@/components/BillingPanel'

export default async function BillingPage() {
  const ctx = await requireWorkspace()
  // Billing belongs to the account that owns the workspace.
  if (!ctx.isOwner) redirect('/dashboard')

  const [linksThisMonth, campaignsCreated, teamMembers] = await Promise.all([
    prisma.link.count({
      where: { userId: ctx.ownerId, createdAt: { gte: startOfMonth(new Date()) } },
    }),
    prisma.campaign.count({ where: { userId: ctx.ownerId } }),
    prisma.teamMember.count({
      where: { userId: ctx.ownerId, status: { in: ['pending', 'active'] } },
    }),
  ])

  return (
    <BillingPanel
      currentPlan={ctx.plan}
      usage={{
        linksThisMonth,
        linkLimit: ctx.capabilities.linksPerMonth,
        campaignsCreated,
        seatsUsed: teamMembers + 1,
        seatLimit: ctx.capabilities.teamSeats,
      }}
      plans={PUBLIC_PLANS}
    />
  )
}
