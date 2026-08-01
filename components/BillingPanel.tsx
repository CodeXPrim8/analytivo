'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { upgradePlanAction } from '@/lib/actions'

type Plan = {
  id: string
  name: string
  price: number
  features: readonly string[]
}

type Usage = {
  linksThisMonth: number
  /** null when the plan allows unlimited links. */
  linkLimit: number | null
  campaignsCreated: number
  seatsUsed: number
  seatLimit: number
}

export function BillingPanel({
  currentPlan,
  usage,
  plans,
}: {
  currentPlan: string
  usage: Usage
  plans: Plan[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const choose = (plan: 'free' | 'pro' | 'business') => {
    startTransition(async () => {
      await upgradePlanAction(plan)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground">
          Current plan: <span className="capitalize text-foreground font-medium">{currentPlan}</span>
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card/50 p-6 grid sm:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Links this month</p>
          <p className="text-2xl font-bold">
            {usage.linksThisMonth}
            {usage.linkLimit !== null && (
              <span className="text-base text-muted-foreground font-normal">
                {' '}
                / {usage.linkLimit}
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Team seats</p>
          <p className="text-2xl font-bold">
            {usage.seatsUsed}
            <span className="text-base text-muted-foreground font-normal">
              {' '}
              / {usage.seatLimit}
            </span>
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Campaigns created</p>
          <p className="text-2xl font-bold">{usage.campaignsCreated}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-xl border border-border bg-card/50 p-6 flex flex-col">
            <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
            <p className="text-3xl font-bold mb-4">
              ${plan.price}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            <ul className="text-sm space-y-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <Button
              disabled={pending || currentPlan === plan.id}
              onClick={() => choose(plan.id as 'free' | 'pro' | 'business')}
            >
              {currentPlan === plan.id ? 'Current plan' : `Switch to ${plan.name}`}
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Plan changes are stored on your account. Stripe/Paystack checkout can be added next for card
        payments.
      </p>
    </div>
  )
}
