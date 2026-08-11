import 'dotenv/config'
import crypto from 'node:crypto'

process.env.PAYSTACK_SECRET_KEY = 'sk_test_fake_secret_for_verification'
process.env.PAYSTACK_PLAN_CODE_PRO = 'PLN_pro_test'
process.env.PAYSTACK_PLAN_CODE_BUSINESS = 'PLN_biz_test'

// Safe to import statically: every helper reads process.env at call time.
import {
  mapSubscriptionStatus,
  planForCode,
  purchasablePlans,
  verifyWebhookSignature,
} from '../lib/paystack'
import { applyPlanChange, entitlementFor, reconcileSeats, restoreSeats } from '../lib/billing'
import { prisma } from '../lib/db'

let failures = 0
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`)
}

function sign(body: string, secret = process.env.PAYSTACK_SECRET_KEY!) {
  return crypto.createHmac('sha512', secret).update(body, 'utf8').digest('hex')
}

async function signatures() {
  console.log('\n-- webhook signature --')
  const body = JSON.stringify({ event: 'charge.success', data: { amount: 1900 } })

  check('valid signature accepted', verifyWebhookSignature(body, sign(body)), true)
  check('tampered body rejected', verifyWebhookSignature(body + ' ', sign(body)), false)
  check('wrong secret rejected', verifyWebhookSignature(body, sign(body, 'sk_other')), false)
  check('missing signature rejected', verifyWebhookSignature(body, null), false)
  check('short signature rejected', verifyWebhookSignature(body, 'abc'), false)

  const forged = JSON.stringify({ event: 'charge.success', data: { amount: 999999 } })
  check('re-signed different body rejected', verifyWebhookSignature(body, sign(forged)), false)
}

async function mapping() {
  console.log('\n-- plan + status mapping --')
  check('pro code maps back', planForCode('PLN_pro_test'), 'pro')
  check('business code maps back', planForCode('PLN_biz_test'), 'business')
  check('unknown code is null', planForCode('PLN_someone_else'), null)
  check('purchasable plans', purchasablePlans(), ['pro', 'business'])
  check('active -> active', mapSubscriptionStatus('active'), 'active')
  check('non-renewing keeps access', mapSubscriptionStatus('non-renewing'), 'active')
  check('attention -> past_due', mapSubscriptionStatus('attention'), 'past_due')
  check('cancelled -> canceled', mapSubscriptionStatus('cancelled'), 'canceled')
}

async function grace() {
  console.log('\n-- grace period --')
  const now = new Date('2026-07-31T12:00:00Z')
  const future = new Date('2026-08-15T00:00:00Z')
  const past = new Date('2026-07-01T00:00:00Z')

  check(
    'active subscription keeps plan',
    entitlementFor({ subscriptionStatus: 'active', subscriptionPlan: 'pro', currentPeriodEnd: future, now }),
    'pro',
  )
  check(
    'failed renewal keeps plan until period end',
    entitlementFor({ subscriptionStatus: 'past_due', subscriptionPlan: 'pro', currentPeriodEnd: future, now }),
    'pro',
  )
  check(
    'failed renewal drops after period end',
    entitlementFor({ subscriptionStatus: 'past_due', subscriptionPlan: 'pro', currentPeriodEnd: past, now }),
    'free',
  )
  check(
    'cancelled keeps plan until period end',
    entitlementFor({ subscriptionStatus: 'canceled', subscriptionPlan: 'business', currentPeriodEnd: future, now }),
    'business',
  )
  check(
    'cancelled drops after period end',
    entitlementFor({ subscriptionStatus: 'canceled', subscriptionPlan: 'business', currentPeriodEnd: past, now }),
    'free',
  )
  check(
    'no subscription is free',
    entitlementFor({ subscriptionStatus: 'none', subscriptionPlan: null, currentPeriodEnd: null, now }),
    'free',
  )
}

async function seats() {
  console.log('\n-- seat reconcile --')
  const ownerId = `billing-test-${Date.now()}`
  await prisma.user.create({
    data: {
      id: ownerId,
      name: 'Seat Test',
      email: `${ownerId}@example.test`,
      plan: 'business',
      workspaceName: 'Seat Test WS',
    },
  })

  // Six members: four who really accepted (so they have linked accounts, oldest
  // first) and two invites that were never accepted.
  const memberUserIds: string[] = []
  for (let i = 0; i < 6; i++) {
    const accepted = i < 4
    let memberUserId: string | null = null

    if (accepted) {
      const account = await prisma.user.create({
        data: {
          id: `${ownerId}-member-${i}`,
          name: `Member ${i}`,
          email: `m${i}-${ownerId}@example.test`,
        },
      })
      memberUserId = account.id
      memberUserIds.push(account.id)
    }

    await prisma.teamMember.create({
      data: {
        userId: ownerId,
        name: `Member ${i}`,
        email: `m${i}-${ownerId}@example.test`,
        status: 'active',
        role: 'viewer',
        invitedAt: new Date(Date.now() + i * 1000),
        acceptedAt: accepted ? new Date(Date.now() + i * 1000) : null,
        memberUserId,
      },
    })
  }

  const live = () =>
    prisma.teamMember.count({ where: { userId: ownerId, status: { in: ['pending', 'active'] } } })

  check('business starts with 6 members', await live(), 6)

  // Pro allows 5 seats including the owner, so 4 invited members.
  await applyPlanChange(ownerId, 'pro', { reason: 'test', notify: false })
  check('downgrade to pro leaves 4 members', await live(), 4)

  // Free allows 1 seat, the owner's, so nobody else.
  await applyPlanChange(ownerId, 'free', { reason: 'test', notify: false })
  check('downgrade to free leaves 0 members', await live(), 0)
  check(
    'suspended rather than deleted',
    await prisma.teamMember.count({ where: { userId: ownerId, status: 'suspended' } }),
    6,
  )

  await applyPlanChange(ownerId, 'business', { reason: 'test', notify: false })
  check('upgrade restores all 6', await live(), 6)

  check(
    'accepted members return to active',
    await prisma.teamMember.count({ where: { userId: ownerId, status: 'active' } }),
    4,
  )
  check(
    'never-accepted invites return as pending, not active',
    await prisma.teamMember.count({ where: { userId: ownerId, status: 'pending' } }),
    2,
  )

  await reconcileSeats(ownerId, 'free')
  check('direct reconcile suspends everyone', await live(), 0)
  await restoreSeats(ownerId, 'pro')
  check('restore respects the pro allowance of 4', await live(), 4)

  await prisma.teamMember.deleteMany({ where: { userId: ownerId } })
  await prisma.notification.deleteMany({ where: { userId: ownerId } })
  await prisma.user.deleteMany({ where: { id: { in: memberUserIds } } })
  await prisma.user.delete({ where: { id: ownerId } })
  console.log('   (test workspace cleaned up)')
}

async function replay() {
  console.log('\n-- webhook replay protection --')
  const body = JSON.stringify({ event: 'charge.success', data: { id: 'replay-test' } })
  const fingerprint = crypto.createHash('sha256').update(body).digest('hex')

  await prisma.processedWebhook.deleteMany({ where: { id: fingerprint } })

  const record = async () => {
    try {
      await prisma.processedWebhook.create({
        data: { id: fingerprint, provider: 'paystack', event: 'charge.success' },
      })
      return 'processed'
    } catch {
      return 'duplicate'
    }
  }

  check('first delivery processed', await record(), 'processed')
  check('retry detected as duplicate', await record(), 'duplicate')

  await prisma.processedWebhook.deleteMany({ where: { id: fingerprint } })
}

async function main() {
  await signatures()
  await mapping()
  await grace()
  await replay()
  await seats()
  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`)
  if (failures > 0) process.exitCode = 1
}

main()
  .catch((error) => {
    console.error('failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
