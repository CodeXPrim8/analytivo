import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { applyPlanChange, entitlementFor } from '@/lib/billing'
import {
  fetchSubscription,
  mapSubscriptionStatus,
  planForCode,
  verifyWebhookSignature,
} from '@/lib/paystack'
import type { PlanId } from '@/lib/plans'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type PaystackEvent = {
  event: string
  data: {
    status?: string
    subscription_code?: string
    email_token?: string
    next_payment_date?: string | null
    customer?: { customer_code?: string; email?: string }
    plan?: { plan_code?: string } | null
    metadata?: { ownerId?: string; plan?: string } | null
    subscription?: { subscription_code?: string } | null
  }
}

/** Finds the workspace a payment belongs to, preferring our own metadata. */
async function resolveOwner(data: PaystackEvent['data']) {
  const ownerId = data.metadata?.ownerId
  if (ownerId) {
    const byId = await prisma.user.findUnique({ where: { id: ownerId } })
    if (byId) return byId
  }

  const code = data.subscription_code || data.subscription?.subscription_code
  if (code) {
    const bySubscription = await prisma.user.findUnique({ where: { subscriptionCode: code } })
    if (bySubscription) return bySubscription
  }

  const customerCode = data.customer?.customer_code
  if (customerCode) {
    const byCustomer = await prisma.user.findFirst({ where: { paystackCustomerCode: customerCode } })
    if (byCustomer) return byCustomer
  }

  const email = data.customer?.email?.trim().toLowerCase()
  if (email) return prisma.user.findUnique({ where: { email } })

  return null
}

export async function POST(request: Request) {
  // Must be the untouched bytes: the signature covers the raw body.
  const rawBody = await request.text()

  if (!verifyWebhookSignature(rawBody, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: PaystackEvent
  try {
    payload = JSON.parse(rawBody) as PaystackEvent
  } catch {
    return NextResponse.json({ error: 'Malformed payload' }, { status: 400 })
  }

  // Paystack retries until it gets a 2xx, so identical bodies must be no-ops.
  const fingerprint = crypto.createHash('sha256').update(rawBody).digest('hex')
  try {
    await prisma.processedWebhook.create({
      data: { id: fingerprint, provider: 'paystack', event: payload.event || 'unknown' },
    })
  } catch {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const owner = await resolveOwner(payload.data)
  if (!owner) {
    // 200 keeps Paystack from retrying something we can never match.
    console.error('[paystack] no workspace matched event', payload.event)
    return NextResponse.json({ ok: true, matched: false })
  }

  const subscriptionCode = payload.data.subscription_code || payload.data.subscription?.subscription_code

  switch (payload.event) {
    case 'subscription.create':
    case 'charge.success':
    case 'invoice.create':
    case 'invoice.update':
    case 'subscription.not_renew':
    case 'subscription.disable':
    case 'invoice.payment_failed': {
      // Ask Paystack for the current state rather than trusting one event's
      // shape, which keeps ordering and partial payloads from mattering.
      const code = subscriptionCode || owner.subscriptionCode
      if (!code) break

      const remote = await fetchSubscription(code)
      if (!remote.ok) {
        console.error('[paystack] could not load subscription', code, remote.error)
        return NextResponse.json({ error: 'Could not load subscription' }, { status: 500 })
      }

      const subscription = remote.data
      const status = mapSubscriptionStatus(subscription.status)
      const paidPlan: PlanId | null = planForCode(subscription.plan?.plan_code)
      const periodEnd = subscription.next_payment_date
        ? new Date(subscription.next_payment_date)
        : owner.currentPeriodEnd

      await prisma.user.update({
        where: { id: owner.id },
        data: {
          billingProvider: 'paystack',
          paystackCustomerCode: subscription.customer?.customer_code ?? owner.paystackCustomerCode,
          subscriptionCode: subscription.subscription_code,
          subscriptionToken: subscription.email_token,
          subscriptionStatus: status,
          subscriptionPlan: paidPlan ?? owner.subscriptionPlan,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: subscription.status === 'non-renewing' || status === 'canceled',
        },
      })

      const entitlement = entitlementFor({
        subscriptionStatus: status,
        subscriptionPlan: paidPlan ?? owner.subscriptionPlan,
        currentPeriodEnd: periodEnd,
      })

      await applyPlanChange(owner.id, entitlement, {
        reason:
          status === 'active'
            ? 'Payment confirmed by Paystack'
            : status === 'past_due'
              ? 'A renewal payment failed, so access ends when the paid period does'
              : 'Subscription cancelled',
      })
      break
    }

    default:
      break
  }

  return NextResponse.json({ ok: true })
}
