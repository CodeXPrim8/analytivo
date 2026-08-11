'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { startOfMonth } from 'date-fns'
import { z } from 'zod'
import QRCode from 'qrcode'
import { ensureDatabase, prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { appBaseUrl, generateAlias, isValidVideoUrl, shortUrlFor } from '@/lib/links'
import { answerInsightQuestion, generateInsightsForUser, insightsProviderLabel } from '@/lib/insights'
import { serializeLink } from '@/lib/analytics'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
  createNotifications,
} from '@/lib/notifications'
import {
  WORKSPACE_COOKIE,
  denyUnlessCapability,
  denyUnlessRole,
  listWorkspacesForUser,
  requireWorkspace,
} from '@/lib/workspace'
import {
  avatarFor,
  inviteUrlFor,
  listTeamMembers,
  newInviteToken,
  normalizeEmail,
} from '@/lib/team'
import { emailEnabled, inviteEmailHtml, sendEmail } from '@/lib/email'
import {
  buildReport,
  normalizeType,
  parseLinkIds,
  parseRecipients,
  reportFileName,
  reportToCsv,
  serializeLinkIds,
} from '@/lib/reports'
import { deliverReport } from '@/lib/report-delivery'
import { applyPlanChange } from '@/lib/billing'
import { PLAN_NAMES } from '@/lib/plans'
import {
  disableSubscription,
  fetchPlan,
  initializeTransaction,
  paystackEnabled,
  planCodeFor,
} from '@/lib/paystack'

async function ready() {
  await ensureDatabase()
}

function setWorkspaceCookie(store: Awaited<ReturnType<typeof cookies>>, ownerId: string) {
  store.set(WORKSPACE_COOKIE, ownerId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}

function revalidateWorkspace() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard/campaigns')
  revalidatePath('/dashboard/analytics')
  revalidatePath('/dashboard/qr-codes')
  revalidatePath('/dashboard/reports')
  revalidatePath('/dashboard/team')
}

/** Links created by this workspace in the current calendar month. */
async function linksUsedThisMonth(ownerId: string) {
  return prisma.link.count({
    where: { userId: ownerId, createdAt: { gte: startOfMonth(new Date()) } },
  })
}

/* ---------------------------------------------------------------- links */

const createLinkSchema = z.object({
  title: z.string().min(1).max(120),
  originalUrl: z.string().url(),
  alias: z.string().max(48).optional(),
  source: z.string().max(64).optional(),
  campaignId: z.string().optional(),
})

export async function createLinkAction(input: z.infer<typeof createLinkSchema>) {
  await ready()
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'editor')
  if (denied) return { error: denied }

  const data = createLinkSchema.parse(input)

  const monthlyLimit = ctx.capabilities.linksPerMonth
  if (monthlyLimit !== null) {
    const used = await linksUsedThisMonth(ctx.ownerId)
    if (used >= monthlyLimit) {
      return {
        error: `You have used all ${monthlyLimit} links included this month. ${
          ctx.isOwner
            ? 'Upgrade from the Billing page for unlimited links.'
            : 'Ask the workspace owner to upgrade.'
        }`,
      }
    }
  }

  if (!isValidVideoUrl(data.originalUrl)) {
    return { error: 'Enter a valid http(s) URL' }
  }

  const alias = generateAlias(data.alias)
  if (!alias) return { error: 'Invalid alias' }

  const exists = await prisma.link.findUnique({ where: { alias } })
  if (exists) return { error: 'That alias is already taken' }

  const link = await prisma.link.create({
    data: {
      title: data.title,
      originalUrl: data.originalUrl,
      alias,
      source: data.source || 'direct',
      campaignId: data.campaignId || null,
      userId: ctx.ownerId,
    },
    include: { _count: { select: { clicks: true } } },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/links')
  return { link: await serializeLink(link, 0), shortUrl: shortUrlFor(alias) }
}

export async function deleteLinkAction(id: string) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'editor')
  if (denied) return { error: denied }

  await prisma.link.deleteMany({ where: { id, userId: ctx.ownerId } })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/links')
  return { ok: true }
}

/* ------------------------------------------------------------ campaigns */

const campaignSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
})

export async function createCampaignAction(input: z.infer<typeof campaignSchema>) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'editor') || denyUnlessCapability(ctx, 'campaigns')
  if (denied) return { error: denied }

  const data = campaignSchema.parse(input)
  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      description: data.description || null,
      userId: ctx.ownerId,
    },
  })
  revalidatePath('/dashboard/campaigns')
  return { campaign }
}

export async function deleteCampaignAction(id: string) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'editor')
  if (denied) return { error: denied }

  await prisma.campaign.deleteMany({ where: { id, userId: ctx.ownerId } })
  revalidatePath('/dashboard/campaigns')
  return { ok: true }
}

/* ------------------------------------------------------------- qr codes */

export async function createQRCodeAction(linkId: string) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'editor')
  if (denied) return { error: denied }

  const link = await prisma.link.findFirst({ where: { id: linkId, userId: ctx.ownerId } })
  if (!link) return { error: 'Link not found' }

  const existing = await prisma.qRCode.findFirst({ where: { linkId, userId: ctx.ownerId } })
  if (existing) return { qr: existing, dataUrl: await QRCode.toDataURL(shortUrlFor(link.alias)) }

  const qr = await prisma.qRCode.create({
    data: { linkId, userId: ctx.ownerId },
  })
  revalidatePath('/dashboard/qr-codes')
  return { qr, dataUrl: await QRCode.toDataURL(shortUrlFor(link.alias)) }
}

export async function getQRDataUrlAction(qrId: string) {
  const ctx = await requireWorkspace()
  const qr = await prisma.qRCode.findFirst({
    where: { id: qrId, userId: ctx.ownerId },
    include: { link: true },
  })
  if (!qr) return { error: 'QR not found' }
  return { dataUrl: await QRCode.toDataURL(shortUrlFor(qr.link.alias)) }
}

/* -------------------------------------------------------------- reports */

const reportSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(['performance', 'audience', 'conversion', 'custom']).default('performance'),
  rangeDays: z.coerce.number().int().min(1).max(365).default(30),
  schedule: z.enum(['none', 'weekly', 'monthly']).default('none'),
  recipients: z.string().max(1000).default(''),
  /** Empty means every link in the workspace. */
  linkIds: z.array(z.string()).max(200).default([]),
})

export async function createReportAction(input: z.infer<typeof reportSchema>) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'editor')
  if (denied) return { error: denied }

  const data = reportSchema.parse(input)
  const recipients = parseRecipients(data.recipients)

  if (data.schedule !== 'none' && recipients.length === 0) {
    return { error: 'Add at least one recipient email to schedule this report.' }
  }
  if (data.schedule !== 'none') {
    const gated = denyUnlessCapability(ctx, 'reportDelivery')
    if (gated) return { error: gated }
  }

  // Only keep ids this workspace actually owns, so a tampered form can't scope
  // a report onto someone else's links.
  let linkIds: string[] = []
  if (data.linkIds.length > 0) {
    const owned = await prisma.link.findMany({
      where: { id: { in: data.linkIds }, userId: ctx.ownerId },
      select: { id: true },
    })
    if (owned.length === 0) {
      return { error: 'Select at least one link from this workspace, or choose all links.' }
    }
    linkIds = owned.map((link) => link.id)
  }

  const report = await prisma.report.create({
    data: {
      name: data.name,
      type: data.type,
      rangeDays: data.rangeDays,
      linkIds: serializeLinkIds(linkIds),
      schedule: data.schedule === 'none' ? null : data.schedule,
      recipients: recipients.join(','),
      userId: ctx.ownerId,
    },
  })

  revalidatePath('/dashboard/reports')
  return {
    report: {
      id: report.id,
      name: report.name,
      type: report.type,
      rangeDays: report.rangeDays,
      linkIds: report.linkIds,
      schedule: report.schedule,
      recipients: report.recipients,
      lastSentAt: report.lastSentAt,
      createdAt: report.createdAt,
    },
  }
}

export async function deleteReportAction(id: string) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'editor')
  if (denied) return { error: denied }

  await prisma.report.deleteMany({ where: { id, userId: ctx.ownerId } })
  revalidatePath('/dashboard/reports')
  return { ok: true }
}

export async function exportReportCsvAction(id: string) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessCapability(ctx, 'reportDelivery')
  if (denied) return { error: denied }

  const report = await prisma.report.findFirst({ where: { id, userId: ctx.ownerId } })
  if (!report) return { error: 'Report not found' }

  const built = await buildReport(ctx.ownerId, {
    name: report.name,
    type: normalizeType(report.type),
    rangeDays: report.rangeDays,
    linkIds: parseLinkIds(report.linkIds),
    workspaceName: ctx.workspaceName,
  })

  return { csv: reportToCsv(built), filename: reportFileName(built) }
}

export async function sendReportNowAction(id: string) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'editor') || denyUnlessCapability(ctx, 'reportDelivery')
  if (denied) return { error: denied }

  const report = await prisma.report.findFirst({ where: { id, userId: ctx.ownerId } })
  if (!report) return { error: 'Report not found' }

  const recipients = parseRecipients(report.recipients)
  if (recipients.length === 0) {
    return { error: 'This report has no recipients yet.' }
  }
  if (!emailEnabled()) {
    return { error: 'Email delivery is not configured. Add RESEND_API_KEY to send reports.' }
  }

  const result = await deliverReport(report, ctx.workspaceName)
  if (!result.ok) return { error: result.error }

  revalidatePath('/dashboard/reports')
  revalidatePath(`/dashboard/reports/${id}`)
  return { ok: true, sent: result.sent }
}

/* ----------------------------------------------------------------- team */

const teamSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
})

export async function inviteTeamMemberAction(input: z.infer<typeof teamSchema>) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'admin')
  if (denied) return { error: denied }

  const data = teamSchema.parse(input)
  const email = normalizeEmail(data.email)

  const owner = await prisma.user.findUnique({
    where: { id: ctx.ownerId },
    select: { name: true, email: true, workspaceName: true },
  })
  if (!owner) return { error: 'Workspace not found' }

  if (email === normalizeEmail(owner.email)) {
    return { error: 'You already own this workspace.' }
  }

  const existing = await prisma.teamMember.findUnique({
    where: { userId_email: { userId: ctx.ownerId, email } },
  })
  if (existing?.status === 'active') {
    return { error: 'That person is already on your team.' }
  }

  // Re-inviting someone already on the roster reuses their seat.
  if (!existing) {
    const roster = await prisma.teamMember.count({
      where: { userId: ctx.ownerId, status: { in: ['pending', 'active'] } },
    })
    const seats = ctx.capabilities.teamSeats
    if (roster + 1 >= seats) {
      return {
        error:
          seats <= 1
            ? `Your plan includes a single seat for you alone. ${
                ctx.isOwner
                  ? 'Upgrade from the Billing page to invite teammates.'
                  : 'Ask the workspace owner to upgrade.'
              }`
            : `All ${seats} seats on your plan are in use. ${
                ctx.isOwner
                  ? 'Upgrade from the Billing page or remove a member first.'
                  : 'Ask the workspace owner to upgrade or free a seat.'
              }`,
      }
    }
  }

  const token = newInviteToken()
  const member = existing
    ? await prisma.teamMember.update({
        where: { id: existing.id },
        data: { name: data.name, role: data.role, inviteToken: token, invitedAt: new Date() },
      })
    : await prisma.teamMember.create({
        data: {
          name: data.name,
          email,
          role: data.role,
          userId: ctx.ownerId,
          avatar: avatarFor(email),
          status: 'pending',
          inviteToken: token,
        },
      })

  const inviteUrl = inviteUrlFor(token)
  let emailed = false
  let emailError: string | undefined

  if (emailEnabled()) {
    const sent = await sendEmail({
      to: email,
      subject: `${owner.name} invited you to ${owner.workspaceName} on Analytivo`,
      html: inviteEmailHtml({
        inviterName: owner.name,
        workspaceName: owner.workspaceName,
        role: data.role,
        inviteUrl,
      }),
    })
    emailed = sent.ok
    if (!sent.ok) emailError = sent.error
  }

  revalidatePath('/dashboard/team')
  return {
    member: {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role as 'admin' | 'editor' | 'viewer',
      avatar: member.avatar || undefined,
      status: 'pending' as const,
      inviteUrl,
      invitedAt: member.invitedAt,
      joinedAt: member.joinedAt,
      isYou: false,
    },
    inviteUrl,
    emailed,
    emailError,
  }
}

export async function resendInviteAction(id: string) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'admin')
  if (denied) return { error: denied }

  const member = await prisma.teamMember.findFirst({ where: { id, userId: ctx.ownerId } })
  if (!member) return { error: 'Invitation not found' }
  if (member.status === 'active') return { error: 'That member already joined.' }

  const owner = await prisma.user.findUnique({
    where: { id: ctx.ownerId },
    select: { name: true, workspaceName: true },
  })

  const token = member.inviteToken || newInviteToken()
  await prisma.teamMember.update({
    where: { id: member.id },
    data: { inviteToken: token, invitedAt: new Date() },
  })

  const inviteUrl = inviteUrlFor(token)
  let emailed = false
  if (emailEnabled() && owner) {
    const sent = await sendEmail({
      to: member.email,
      subject: `Reminder: join ${owner.workspaceName} on Analytivo`,
      html: inviteEmailHtml({
        inviterName: owner.name,
        workspaceName: owner.workspaceName,
        role: member.role,
        inviteUrl,
      }),
    })
    emailed = sent.ok
  }

  revalidatePath('/dashboard/team')
  return { ok: true, inviteUrl, emailed }
}

export async function updateTeamMemberRoleAction(
  id: string,
  role: 'admin' | 'editor' | 'viewer',
) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'admin')
  if (denied) return { error: denied }

  const member = await prisma.teamMember.findFirst({ where: { id, userId: ctx.ownerId } })
  if (!member) return { error: 'Member not found' }

  await prisma.teamMember.update({ where: { id: member.id }, data: { role } })

  if (member.memberUserId) {
    await createNotifications(member.memberUserId, [
      {
        title: 'Your workspace role changed',
        body: `You are now ${role} in ${ctx.workspaceName}.`,
        type: 'team',
        href: '/dashboard/team',
      },
    ])
  }

  revalidatePath('/dashboard/team')
  return { ok: true }
}

export async function removeTeamMemberAction(id: string) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'admin')
  if (denied) return { error: denied }

  const member = await prisma.teamMember.findFirst({ where: { id, userId: ctx.ownerId } })
  if (!member) return { ok: true }

  await prisma.teamMember.delete({ where: { id: member.id } })

  if (member.memberUserId) {
    await createNotifications(member.memberUserId, [
      {
        title: `Removed from ${ctx.workspaceName}`,
        body: 'You no longer have access to that workspace.',
        type: 'team',
        href: '/dashboard',
      },
    ])
  }

  revalidatePath('/dashboard/team')
  return { ok: true }
}

export async function acceptInviteAction(token: string) {
  const user = await requireUser()

  const invite = await prisma.teamMember.findUnique({
    where: { inviteToken: token },
    include: { user: { select: { id: true, name: true, workspaceName: true } } },
  })
  if (!invite) return { error: 'This invitation link is no longer valid.' }
  if (invite.userId === user.id) return { error: 'You already own this workspace.' }
  if (invite.status === 'suspended') {
    // Accepting would hand out a seat the workspace's plan no longer covers.
    return { error: 'This workspace has run out of seats. Ask the owner to upgrade.' }
  }
  if (invite.status === 'active') return { error: 'This invitation was already accepted.' }

  if (normalizeEmail(invite.email) !== normalizeEmail(user.email)) {
    return {
      error: `This invitation is for ${invite.email}. Sign in with that email to accept it.`,
    }
  }

  await prisma.teamMember.update({
    where: { id: invite.id },
    data: {
      status: 'active',
      memberUserId: user.id,
      acceptedAt: new Date(),
      joinedAt: new Date(),
      inviteToken: null,
      name: user.name || invite.name,
      avatar: user.image || invite.avatar,
    },
  })

  await createNotifications(invite.userId, [
    {
      title: `${user.name || invite.email} joined your workspace`,
      body: `They accepted the ${invite.role} invitation to ${invite.user.workspaceName}.`,
      type: 'team',
      href: '/dashboard/team',
    },
  ])

  const store = await cookies()
  setWorkspaceCookie(store, invite.userId)

  revalidateWorkspace()
  return { ok: true, workspaceName: invite.user.workspaceName }
}

export async function leaveWorkspaceAction(ownerId: string) {
  const user = await requireUser()
  const membership = await prisma.teamMember.findFirst({
    where: { userId: ownerId, memberUserId: user.id, status: 'active' },
  })
  if (!membership) return { error: 'You are not a member of that workspace.' }

  await prisma.teamMember.delete({ where: { id: membership.id } })

  const store = await cookies()
  setWorkspaceCookie(store, user.id)

  revalidateWorkspace()
  return { ok: true }
}

export async function switchWorkspaceAction(ownerId: string) {
  const user = await requireUser()
  const workspaces = await listWorkspacesForUser(user.id)
  if (!workspaces.some((w) => w.ownerId === ownerId)) {
    return { error: 'You do not have access to that workspace.' }
  }

  const store = await cookies()
  setWorkspaceCookie(store, ownerId)

  revalidateWorkspace()
  return { ok: true }
}

export async function getTeamAction() {
  const ctx = await requireWorkspace()
  const members = await listTeamMembers(ctx.ownerId, ctx.user.id)
  return { members, role: ctx.role }
}

/* -------------------------------------------------------------- profile */

export async function updateProfileAction(input: {
  name: string
  workspaceName: string
  image?: string | null
}) {
  const user = await requireUser()
  const data: { name: string; workspaceName: string; image?: string | null } = {
    name: input.name.trim(),
    workspaceName: input.workspaceName.trim() || 'My Workspace',
  }

  if (input.image !== undefined) {
    if (input.image === null || input.image === '') {
      data.image = null
    } else if (
      typeof input.image === 'string' &&
      input.image.startsWith('data:image/') &&
      input.image.length <= 450_000
    ) {
      data.image = input.image
    } else {
      return { error: 'Image must be a small JPG/PNG/WebP under ~300KB' }
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
  })

  // Keep the roster entry in workspaces this user belongs to in sync.
  await prisma.teamMember.updateMany({
    where: { memberUserId: user.id },
    data: { name: data.name, ...(data.image !== undefined ? { avatar: data.image } : {}) },
  })

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { user: updated }
}

/* -------------------------------------------------------- notifications */

export async function getNotificationsAction() {
  const user = await requireUser()
  const [items, unreadCount] = await Promise.all([
    listNotifications(user.id),
    unreadNotificationCount(user.id),
  ])
  return {
    unreadCount,
    notifications: items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      href: n.href,
      read: n.read,
      createdAt: n.createdAt,
    })),
  }
}

export async function markNotificationReadAction(id: string) {
  const user = await requireUser()
  await markNotificationRead(user.id, id)
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser()
  await markAllNotificationsRead(user.id)
  revalidatePath('/dashboard')
  return { ok: true }
}

/* ------------------------------------------------------------- insights */

export async function refreshInsightsAction() {
  const ctx = await requireWorkspace()
  const denied = denyUnlessCapability(ctx, 'aiInsights')
  if (denied) return { error: denied }

  const insights = await generateInsightsForUser(ctx.ownerId, ctx.user.id)
  revalidatePath('/dashboard/ai-insights')
  revalidatePath('/dashboard')
  return {
    provider: insightsProviderLabel(),
    insights: insights.map((i) => ({
      ...i,
      actionItems: JSON.parse(i.actionItems) as string[],
    })),
  }
}

export async function askInsightAction(question: string) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessCapability(ctx, 'aiInsights')
  if (denied) return { error: denied }

  const q = question.trim()
  if (!q) return { error: 'Ask a question about your performance' }

  const { answer, provider } = await answerInsightQuestion(ctx.ownerId, q)
  return { answer, provider }
}

/* -------------------------------------------------------------- billing */

/**
 * Starts a hosted Paystack checkout and hands back the URL to send the browser
 * to. Deliberately does not touch `plan`: only the webhook may do that, since
 * reaching this code proves nothing about whether a payment succeeded.
 */
export async function startCheckoutAction(plan: 'pro' | 'business') {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'owner')
  if (denied) return { error: denied }

  if (!paystackEnabled()) {
    return { error: 'Payments are not configured yet. Add PAYSTACK_SECRET_KEY to enable checkout.' }
  }

  const planCode = planCodeFor(plan)
  if (!planCode) {
    return { error: `No Paystack plan code is configured for ${PLAN_NAMES[plan]}.` }
  }

  // Read the price from Paystack rather than from this repo, so a customer can
  // only ever be charged what the dashboard says the plan costs.
  const remotePlan = await fetchPlan(planCode)
  if (!remotePlan.ok) return { error: remotePlan.error }

  const checkout = await initializeTransaction({
    email: ctx.user.email,
    amount: remotePlan.data.amount,
    currency: remotePlan.data.currency,
    planCode,
    callbackUrl: `${appBaseUrl()}/dashboard/billing?checkout=complete`,
    // Echoed back on the webhook so the payment can be tied to a workspace even
    // if the customer paid with a different email than their account.
    metadata: { ownerId: ctx.ownerId, plan },
  })
  if (!checkout.ok) return { error: checkout.error }

  return { ok: true, url: checkout.data.authorization_url }
}

/**
 * Stops the subscription renewing. Access is intentionally left alone here —
 * the customer keeps what they paid for until `currentPeriodEnd`, and the
 * billing sweep drops them to free once it passes.
 */
export async function cancelSubscriptionAction() {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'owner')
  if (denied) return { error: denied }

  const owner = await prisma.user.findUnique({
    where: { id: ctx.ownerId },
    select: { subscriptionCode: true, subscriptionToken: true },
  })
  if (!owner?.subscriptionCode || !owner.subscriptionToken) {
    return { error: 'There is no active subscription to cancel.' }
  }

  const result = await disableSubscription(owner.subscriptionCode, owner.subscriptionToken)
  if (!result.ok) return { error: result.error }

  await prisma.user.update({
    where: { id: ctx.ownerId },
    data: { cancelAtPeriodEnd: true, subscriptionStatus: 'canceled' },
  })

  revalidatePath('/dashboard/billing')
  return { ok: true }
}

/**
 * Local-only escape hatch for exercising the plan gates without a card.
 * NODE_ENV is "production" on every Vercel deployment including previews, so
 * this cannot be reached on a deployed site.
 */
export async function setPlanForTestingAction(plan: 'free' | 'pro' | 'business') {
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Not available.' }
  }

  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'owner')
  if (denied) return { error: denied }

  await applyPlanChange(ctx.ownerId, plan, { reason: 'Changed from local testing controls' })
  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard/team')
  return { ok: true, plan }
}
