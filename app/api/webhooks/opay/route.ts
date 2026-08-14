import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { applyPlanChange } from '@/lib/billing'
import {
  parseOpayReference,
  prepaidPeriodEnd,
  queryPaymentStatus,
  verifyCallbackSignature,
  amountKoboFor,
} from '@/lib/opay'
import { PLAN_NAMES, normalizePlan, type PlanId } from '@/lib/plans'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type CallbackBody = {
  sha512?: string
  signature?: string
  payload?: Record<string, unknown>
  reference?: string
  orderNo?: string
  status?: string
}

function extractOrder(body: CallbackBody) {
  const nested = body.payload
  if (nested && typeof nested === 'object') {
    return {
      reference: String(nested.reference || ''),
      orderNo: nested.orderNo ? String(nested.orderNo) : undefined,
      status: String(nested.status || '').toUpperCase(),
    }
  }
  return {
    reference: String(body.reference || ''),
    orderNo: body.orderNo ? String(body.orderNo) : undefined,
    status: String(body.status || '').toUpperCase(),
  }
}

/**
 * OPay does not run recurring plans the way Paystack does. Each successful
 * cashier payment buys one month. Access is granted only after /cashier/status
 * confirms SUCCESS — never from the callback body alone.
 */
export async function POST(request: Request) {
  const rawBody = await request.text()

  let body: CallbackBody
  try {
    body = JSON.parse(rawBody) as CallbackBody
  } catch {
    return NextResponse.json({ error: 'Malformed payload' }, { status: 400 })
  }

  // Prefer the signed nested form; unsigned root payloads still require a
  // live status query below before anything changes.
  const hasNestedSignature = Boolean(body.payload && (body.sha512 || body.signature))
  if (hasNestedSignature && !verifyCallbackSignature(rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const order = extractOrder(body)
  if (!order.reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
  }

  const fingerprint = crypto.createHash('sha256').update(`opay:${rawBody}`).digest('hex')
  try {
    await prisma.processedWebhook.create({
      data: {
        id: fingerprint,
        provider: 'opay',
        event: order.status || 'callback',
      },
    })
  } catch {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const remote = await queryPaymentStatus(order.reference)
  if (!remote.ok) {
    console.error('[opay] status query failed', order.reference, remote.error)
    return NextResponse.json({ error: 'Could not verify payment' }, { status: 500 })
  }

  const status = String(remote.data.status || '').toUpperCase()
  if (status !== 'SUCCESS') {
    return NextResponse.json({ ok: true, status })
  }

  const parsed = parseOpayReference(remote.data.reference || order.reference)
  if (!parsed) {
    console.error('[opay] unrecognised reference', remote.data.reference)
    return NextResponse.json({ ok: true, matched: false })
  }

  const owner = await prisma.user.findUnique({ where: { id: parsed.ownerId } })
  if (!owner) {
    console.error('[opay] no workspace for reference', remote.data.reference)
    return NextResponse.json({ ok: true, matched: false })
  }

  const plan: PlanId = normalizePlan(parsed.plan)
  if (plan === 'free') {
    return NextResponse.json({ ok: true, matched: false })
  }

  const expectedKobo = amountKoboFor(plan)
  const paid = remote.data.amount?.total
  if (expectedKobo && typeof paid === 'number' && paid > 0 && paid < expectedKobo) {
    console.error('[opay] amount below plan price', remote.data.reference, paid, expectedKobo)
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
  }

  const now = new Date()
  const base =
    owner.billingProvider === 'opay' &&
    owner.currentPeriodEnd &&
    owner.currentPeriodEnd.getTime() > now.getTime()
      ? owner.currentPeriodEnd
      : now
  const periodEnd = prepaidPeriodEnd(base)

  await prisma.user.update({
    where: { id: owner.id },
    data: {
      billingProvider: 'opay',
      opayReference: remote.data.reference || order.reference,
      opayOrderNo: remote.data.orderNo || order.orderNo || null,
      // Prepaid month — no auto-renew — so cancelAtPeriodEnd stays true and
      // the billing sweep drops the plan when the month ends.
      subscriptionStatus: 'active',
      subscriptionPlan: plan,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: true,
      // Clear Paystack subscription pointers so cancel/renew cannot hit the
      // wrong gateway after a switch.
      subscriptionCode: null,
      subscriptionToken: null,
      paystackCustomerCode: owner.paystackCustomerCode,
    },
  })

  await applyPlanChange(owner.id, plan, {
    reason: `Payment confirmed by OPay for ${PLAN_NAMES[plan]}`,
  })

  return NextResponse.json({ ok: true })
}
