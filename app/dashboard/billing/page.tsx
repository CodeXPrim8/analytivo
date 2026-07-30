import { requireUser } from '@/lib/session'
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
  const user = await requireUser()
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  const [linksCreated, campaignsCreated] = await Promise.all([
    prisma.link.count({ where: { userId: user.id } }),
    prisma.campaign.count({ where: { userId: user.id } }),
  ])

  return (
    <BillingPanel
      currentPlan={dbUser.plan}
      usage={{ linksCreated, campaignsCreated }}
      plans={[...PLANS]}
    />
  )
}
