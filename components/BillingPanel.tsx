'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cancelSubscriptionAction, setPlanForTestingAction } from '@/lib/actions'
import { formatPlanPrice } from '@/lib/plans'

type PlanId = 'free' | 'pro' | 'business'

type Plan = {
  id: string
  name: string
  price: number
  currency: string
  features: readonly string[]
}

type Usage = {
  linksThisMonth: number
  linkLimit: number | null
  campaignsCreated: number
  seatsUsed: number
  seatLimit: number
  suspendedMembers: number
}

type Subscription = {
  status: string
  paidPlan: string | null
  currentPeriodEnd: Date | string | null
  cancelAtPeriodEnd: boolean
  provider: string | null
}

function dateLabel(value: Date | string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function BillingPanel({
  currentPlan,
  usage,
  subscription,
  plans,
  paymentsConfigured,
  showTestControls = false,
}: {
  currentPlan: string
  usage: Usage
  subscription: Subscription
  plans: Plan[]
  paymentsConfigured: boolean
  showTestControls?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const cancel = () => {
    setError('')
    startTransition(async () => {
      const result = await cancelSubscriptionAction()
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const switchForTesting = (plan: PlanId) => {
    setError('')
    startTransition(async () => {
      const result = await setPlanForTestingAction(plan)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const periodEnd = subscription.currentPeriodEnd
  const statusNote = () => {
    if (subscription.status === 'past_due' && periodEnd) {
      return {
        tone: 'warn' as const,
        text: `A renewal payment failed. Your ${currentPlan} features stay on until ${dateLabel(periodEnd)}, then the workspace moves to Free.`,
      }
    }
    if (subscription.cancelAtPeriodEnd && periodEnd) {
      return {
        tone: 'info' as const,
        text: `Your plan stays active until ${dateLabel(periodEnd)}. ${
          subscription.provider === 'opay'
            ? 'OPay charges one month at a time — pay again before then to renew.'
            : 'Auto-renew is off.'
        }`,
      }
    }
    if (subscription.status === 'active' && periodEnd && subscription.provider === 'opay') {
      return {
        tone: 'info' as const,
        text: `OPay access runs until ${dateLabel(periodEnd)}. Pay again to extend another month.`,
      }
    }
    return null
  }

  const note = statusNote()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground">
          Manage your workspace plan. Paid features unlock only after payment is confirmed.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {note && (
        <div
          className={`mb-6 p-3 rounded-lg text-sm flex items-start gap-2 ${
            note.tone === 'warn'
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-muted/50 border border-border text-muted-foreground'
          }`}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{note.text}</span>
        </div>
      )}

      {usage.suspendedMembers > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-amber-500/10 text-amber-400 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            {usage.suspendedMembers} team member
            {usage.suspendedMembers === 1 ? ' is' : 's are'} suspended because your plan does not
            include enough seats. Upgrading restores their access automatically.
          </span>
        </div>
      )}

      {!paymentsConfigured && (
        <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
          Card payments are not configured yet. Add Paystack and/or OPay keys to enable checkout.
        </div>
      )}

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
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id

          return (
            <div
              key={plan.id}
              className="rounded-xl border border-border bg-card/50 p-6 flex flex-col"
            >
              <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold mb-4">
                {formatPlanPrice(plan.price, plan.currency)}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="text-sm space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                isCurrent ? (
                  <Button disabled>Current plan</Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled={pending || !subscription.paidPlan || subscription.cancelAtPeriodEnd}
                    onClick={cancel}
                  >
                    {pending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving…
                      </>
                    ) : subscription.cancelAtPeriodEnd ? (
                      'Cancellation pending'
                    ) : (
                      'Cancel subscription'
                    )}
                  </Button>
                )
              ) : isCurrent ? (
                <Button asChild className="w-full">
                  <Link href={`/dashboard/billing/payment-option?plan=${plan.id}`}>Renew plan</Link>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href={`/dashboard/billing/payment-option?plan=${plan.id}`}>
                    Switch to {plan.name}
                  </Link>
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        After you choose a plan you will pick Paystack or OPay on the next page. Your plan changes
        only after the provider confirms the charge.
      </p>

      {showTestControls && (
        <div className="mt-8 rounded-xl border border-dashed border-border p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Local development only — set the plan directly to exercise the feature gates without a
            card. This is unavailable on any deployment.
          </p>
          <div className="flex flex-wrap gap-2">
            {(['free', 'pro', 'business'] as const).map((plan) => (
              <Button
                key={plan}
                variant="outline"
                size="sm"
                disabled={pending || currentPlan === plan}
                onClick={() => switchForTesting(plan)}
              >
                {currentPlan === plan ? `${plan} (current)` : `Set ${plan}`}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
