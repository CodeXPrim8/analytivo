import { redirect } from 'next/navigation'
import { requireWorkspace } from '@/lib/workspace'
import { prisma } from '@/lib/db'
import { BillingPanel } from '@/components/BillingPanel'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['25 links / month', 'Basic analytics', '1 team seat'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    features: ['Unlimited links', 'Campaigns + QR', 'AI insights', '5 team seats'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 49,
    features: ['Everything in Pro', 'Priority support', 'Custom branding', '25 team seats'],
  },
] as const

export default async function BillingPage() {
  const ctx = await requireWorkspace()
  // Billing belongs to the account that owns the workspace.
  if (!ctx.isOwner) redirect('/dashboard')

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: ctx.ownerId } })
  const [linksCreated, campaignsCreated] = await Promise.all([
    prisma.link.count({ where: { userId: ctx.ownerId } }),
    prisma.campaign.count({ where: { userId: ctx.ownerId } }),
  ])

  return (
    <BillingPanel
      currentPlan={dbUser.plan}
      usage={{ linksCreated, campaignsCreated }}
      plans={[...PLANS]}
    />
  )
}
