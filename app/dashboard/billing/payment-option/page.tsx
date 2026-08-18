import { redirect } from 'next/navigation'
import { requireWorkspace } from '@/lib/workspace'
import { PUBLIC_PLANS } from '@/lib/plans'
import { PaymentOptionPanel } from '@/components/PaymentOptionPanel'

export const dynamic = 'force-dynamic'

export default async function PaymentOptionPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const ctx = await requireWorkspace()
  if (!ctx.isOwner) redirect('/dashboard')

  const { plan } = await searchParams
  if (plan !== 'pro' && plan !== 'business') redirect('/dashboard/billing')

  const selected = PUBLIC_PLANS.find((row) => row.id === plan)
  if (!selected) redirect('/dashboard/billing')

  return (
    <PaymentOptionPanel
      plan={plan}
      planName={selected.name}
      price={selected.price}
      currency={selected.currency}
    />
  )
}
