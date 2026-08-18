'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startCheckoutAction } from '@/lib/actions'
import { formatPlanPrice, type PlanId } from '@/lib/plans'

type PaymentProvider = 'paystack' | 'opay'

export function PaymentOptionPanel({
  plan,
  planName,
  price,
  currency,
  localDev = false,
}: {
  plan: Exclude<PlanId, 'free'>
  planName: string
  price: number
  currency: string
  localDev?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<PaymentProvider | null>(null)
  const [error, setError] = useState('')

  const pay = (provider: PaymentProvider) => {
    setError('')
    setBusy(provider)
    startTransition(async () => {
      const result = await startCheckoutAction(plan, provider)
      if (result.error || !result.url) {
        setError(result.error || 'Could not start checkout.')
        setBusy(null)
        return
      }
      window.location.assign(result.url)
    })
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={16} />
        Back to billing
      </Link>

      <h1 className="text-3xl font-bold mb-2">Payment option</h1>
      <p className="text-muted-foreground mb-8">
        You are paying for <span className="text-foreground font-medium">{planName}</span>{' '}
        ({formatPlanPrice(price, currency)}
        /mo). Choose how you want to pay.
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card/50 p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-2">Paystack</h2>
          <p className="text-sm text-muted-foreground mb-6 flex-1">
            Recurring monthly subscription. Card and bank options on Paystack checkout.
          </p>
          <Button className="w-full gap-2" disabled={pending} onClick={() => pay('paystack')}>
            {busy === 'paystack' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Redirecting…
              </>
            ) : (
              <>
                <ExternalLink size={16} />
                Continue with Paystack
              </>
            )}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-2">OPay</h2>
          <p className="text-sm text-muted-foreground mb-6 flex-1">
            {localDev
              ? 'Prepaid access. Local sandbox lasts 5 minutes so you can confirm upgrade and expiry before going live.'
              : 'One prepaid month. Pay again when the month ends to keep the plan.'}
          </p>
          <Button
            className="w-full gap-2"
            variant="outline"
            disabled={pending}
            onClick={() => pay('opay')}
          >
            {busy === 'opay' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Redirecting…
              </>
            ) : (
              <>
                <ExternalLink size={16} />
                Continue with OPay
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
