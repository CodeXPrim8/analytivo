'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'
import QRCode from 'qrcode'
import { ensureDatabase, prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { generateAlias, isValidVideoUrl, shortUrlFor } from '@/lib/links'
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
  parseRecipients,
  reportFileName,
  reportToCsv,
} from '@/lib/reports'
import { deliverReport } from '@/lib/report-delivery'

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
  const denied = denyUnlessRole(ctx, 'editor')
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

  const report = await prisma.report.create({
    data: {
      name: data.name,
      type: data.type,
      rangeDays: data.rangeDays,
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
  const report = await prisma.report.findFirst({ where: { id, userId: ctx.ownerId } })
  if (!report) return { error: 'Report not found' }

  const built = await buildReport(ctx.ownerId, {
    name: report.name,
    type: normalizeType(report.type),
    rangeDays: report.rangeDays,
    workspaceName: ctx.workspaceName,
  })

  return { csv: reportToCsv(built), filename: reportFileName(built) }
}

export async function sendReportNowAction(id: string) {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'editor')
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
  const q = question.trim()
  if (!q) return { error: 'Ask a question about your performance' }

  const { answer, provider } = await answerInsightQuestion(ctx.ownerId, q)
  return { answer, provider }
}

/* -------------------------------------------------------------- billing */

export async function upgradePlanAction(plan: 'free' | 'pro' | 'business') {
  const ctx = await requireWorkspace()
  const denied = denyUnlessRole(ctx, 'owner')
  if (denied) return { error: denied }

  await prisma.user.update({
    where: { id: ctx.ownerId },
    data: { plan },
  })
  revalidatePath('/dashboard/billing')
  return { ok: true, plan }
}
