import crypto from 'node:crypto'
import type { PlanId } from '@/lib/plans'

const API_BASE = 'https://api.paystack.co'

export function paystackSecret() {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || ''
}

export function paystackEnabled() {
  return Boolean(paystackSecret())
}

/**
 * Paystack plan codes are created in the dashboard, so the price a customer is
 * actually charged lives there rather than in this repo.
 */
export function planCodeFor(plan: PlanId): string | null {
  if (plan === 'pro') return process.env.PAYSTACK_PLAN_CODE_PRO?.trim() || null
  if (plan === 'business') return process.env.PAYSTACK_PLAN_CODE_BUSINESS?.trim() || null
  return null
}

export function planForCode(code?: string | null): PlanId | null {
  if (!code) return null
  if (code === process.env.PAYSTACK_PLAN_CODE_PRO?.trim()) return 'pro'
  if (code === process.env.PAYSTACK_PLAN_CODE_BUSINESS?.trim()) return 'business'
  return null
}

/** Plans that can be bought right now, i.e. have a code configured. */
export function purchasablePlans(): PlanId[] {
  return (['pro', 'business'] as const).filter((plan) => planCodeFor(plan))
}

/**
 * Paystack signs the raw body with HMAC SHA512 using the secret key. The body
 * must be the exact bytes received — parsing and re-encoding changes the hash.
 */
export function verifyWebhookSignature(rawBody: string, signature?: string | null) {
  const secret = paystackSecret()
  if (!secret || !signature) return false

  const expected = crypto.createHmac('sha512', secret).update(rawBody, 'utf8').digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  // timingSafeEqual throws on length mismatch, so compare that first.
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

type PaystackResponse<T> = { status: boolean; message: string; data: T }

async function paystackFetch<T>(
  path: string,
  init?: { method?: 'GET' | 'POST'; body?: unknown },
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const secret = paystackSecret()
  if (!secret) return { ok: false, error: 'Payments are not configured.' }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: init?.method || 'GET',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    })

    const payload = (await res.json()) as PaystackResponse<T>
    if (!res.ok || !payload.status) {
      return { ok: false, error: payload?.message || `Paystack error ${res.status}` }
    }
    return { ok: true, data: payload.data }
  } catch (error) {
    console.error('[paystack] request failed:', path, error)
    return { ok: false, error: 'Could not reach Paystack. Try again in a moment.' }
  }
}

export type PaystackPlan = {
  name: string
  plan_code: string
  amount: number
  currency: string
  interval: string
}

export function fetchPlan(planCode: string) {
  return paystackFetch<PaystackPlan>(`/plan/${encodeURIComponent(planCode)}`)
}

export type PaystackSubscription = {
  subscription_code: string
  email_token: string
  status: string
  next_payment_date: string | null
  customer: { customer_code: string; email: string }
  plan: { plan_code: string }
}

export function fetchSubscription(code: string) {
  return paystackFetch<PaystackSubscription>(`/subscription/${encodeURIComponent(code)}`)
}

export function initializeTransaction(input: {
  email: string
  amount: number
  currency: string
  planCode: string
  callbackUrl: string
  metadata: Record<string, unknown>
}) {
  return paystackFetch<{ authorization_url: string; reference: string }>(
    '/transaction/initialize',
    {
      method: 'POST',
      body: {
        email: input.email,
        // Sent for API validity; the plan code is what actually sets the price.
        amount: input.amount,
        currency: input.currency,
        plan: input.planCode,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      },
    },
  )
}

export function disableSubscription(code: string, emailToken: string) {
  return paystackFetch<unknown>('/subscription/disable', {
    method: 'POST',
    body: { code, token: emailToken },
  })
}

/**
 * Paystack statuses mapped onto ours. "attention" means a renewal charge failed
 * but the subscription is alive, which is exactly a dunning window.
 */
export function mapSubscriptionStatus(status: string): 'active' | 'past_due' | 'canceled' {
  switch (status) {
    case 'active':
    case 'non-renewing':
      return 'active'
    case 'attention':
      return 'past_due'
    default:
      return 'canceled'
  }
}
