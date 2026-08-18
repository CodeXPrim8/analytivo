import crypto from 'node:crypto'
import { nanoid } from 'nanoid'
import { PUBLIC_PLANS, type PlanId } from '@/lib/plans'

/** Live by default; set OPAY_BASE_URL to the sandbox host while testing. */
function opayBaseUrl() {
  return (
    env('OPAY_BASE_URL').replace(/\/$/, '') ||
    'https://liveapi.opaycheckout.com/api/v1/international'
  )
}

function env(name: string) {
  return (process.env[name] || '').trim().replace(/^["']|["']$/g, '')
}

export function opayMerchantId() {
  return env('OPAY_MERCHANT_ID')
}

export function opayPublicKey() {
  return env('OPAY_PUBLIC_KEY')
}

export function opaySecretKey() {
  return env('OPAY_SECRET_KEY')
}

export function opayEnabled() {
  return Boolean(opayMerchantId() && opayPublicKey() && opaySecretKey())
}

/** Paid tiers that OPay can collect for (prices come from PUBLIC_PLANS). */
export function opayPurchasablePlans(): PlanId[] {
  return ['pro', 'business']
}

/** Naira major units → kobo (OPay amount.total is the smallest currency unit). */
export function amountKoboFor(plan: PlanId): number | null {
  const row = PUBLIC_PLANS.find((p) => p.id === plan)
  if (!row || row.price <= 0) return null
  return Math.round(row.price * 100)
}

export function signPayload(rawJson: string) {
  const secret = opaySecretKey()
  if (!secret) return ''
  return crypto.createHmac('sha512', secret).update(rawJson, 'utf8').digest('hex')
}

/**
 * OPay callbacks either nest the order under `payload` with a top-level `sha512`,
 * or send the order fields at the root. We accept both and always re-check with
 * /cashier/status before granting access.
 */
export function verifyCallbackSignature(rawBody: string): boolean {
  const secret = opaySecretKey()
  if (!secret) return false

  try {
    const parsed = JSON.parse(rawBody) as {
      sha512?: string
      signature?: string
      payload?: unknown
    }
    const provided = parsed.sha512 || parsed.signature
    if (!provided || parsed.payload === undefined) return false

    const payloadJson = JSON.stringify(parsed.payload)
    const expected = signPayload(payloadJson)
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(String(provided), 'utf8')
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

type OpayEnvelope<T> = {
  code: string
  message: string
  data?: T
}

async function opayFetch<T>(
  path: string,
  body: unknown,
  auth: 'public' | 'signature',
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const merchantId = opayMerchantId()
  if (!merchantId) return { ok: false, error: 'OPay is not configured.' }

  const raw = JSON.stringify(body)
  const bearer =
    auth === 'public' ? opayPublicKey() : signPayload(raw)
  if (!bearer) return { ok: false, error: 'OPay is not configured.' }

  try {
    const res = await fetch(`${opayBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearer}`,
        MerchantId: merchantId,
      },
      body: raw,
      cache: 'no-store',
    })

    const payload = (await res.json()) as OpayEnvelope<T>
    if (!res.ok || payload.code !== '00000' || !payload.data) {
      return {
        ok: false,
        error: payload?.message || `OPay error ${res.status}`,
      }
    }
    return { ok: true, data: payload.data }
  } catch (error) {
    console.error('[opay] request failed:', path, error)
    return { ok: false, error: 'Could not reach OPay. Try again in a moment.' }
  }
}

export type OpayCashierCreate = {
  reference: string
  orderNo: string
  cashierUrl: string
  status: string
}

export type OpayPaymentStatus = {
  reference: string
  orderNo?: string
  status: string
  amount?: { total: number; currency: string }
}

/** Merchant reference embeds plan + owner so the webhook can resolve without a lookup table. */
export function buildOpayReference(ownerId: string, plan: PlanId) {
  // Fixed-length nonce first so ownerId may contain underscores safely.
  return `av_${plan}_${nanoid(10)}_${ownerId}`
}

export function parseOpayReference(reference?: string | null): {
  plan: PlanId
  ownerId: string
} | null {
  if (!reference) return null
  const match = /^av_(pro|business)_([A-Za-z0-9_-]{10})_(.+)$/.exec(reference)
  if (!match) return null
  return { plan: match[1] as PlanId, ownerId: match[3] }
}

export function createCashierPayment(input: {
  reference: string
  amountKobo: number
  returnUrl: string
  callbackUrl: string
  cancelUrl: string
  productName: string
  productDescription: string
  user: { id: string; email: string; name?: string | null }
}) {
  return opayFetch<OpayCashierCreate>(
    '/cashier/create',
    {
      country: 'NG',
      reference: input.reference,
      amount: { total: input.amountKobo, currency: 'NGN' },
      returnUrl: input.returnUrl,
      callbackUrl: input.callbackUrl,
      cancelUrl: input.cancelUrl,
      expireAt: 60,
      customerVisitSource: 'BROWSER',
      evokeOpay: false,
      userInfo: {
        userId: input.user.id,
        userEmail: input.user.email,
        userName: input.user.name || undefined,
      },
      product: {
        name: input.productName,
        description: input.productDescription,
      },
    },
    'public',
  )
}

export function queryPaymentStatus(reference: string) {
  return opayFetch<OpayPaymentStatus>(
    '/cashier/status',
    { reference, country: 'NG' },
    'signature',
  )
}

/** One calendar month of access from a successful OPay payment. */
export function prepaidPeriodEnd(from = new Date()) {
  const end = new Date(from)
  end.setUTCMonth(end.getUTCMonth() + 1)
  return end
}
