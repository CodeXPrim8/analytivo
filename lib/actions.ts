'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import QRCode from 'qrcode'
import { ensureDatabase, prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { generateAlias, isValidVideoUrl, shortUrlFor } from '@/lib/links'
import { generateInsightsForUser } from '@/lib/insights'
import { serializeLink } from '@/lib/analytics'

async function ready() {
  await ensureDatabase()
}

const createLinkSchema = z.object({
  title: z.string().min(1).max(120),
  originalUrl: z.string().url(),
  alias: z.string().max(48).optional(),
  source: z.string().max(64).optional(),
  campaignId: z.string().optional(),
})

export async function createLinkAction(input: z.infer<typeof createLinkSchema>) {
  await ready()
  const user = await requireUser()
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
      userId: user.id,
    },
    include: { _count: { select: { clicks: true } } },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/links')
  return { link: await serializeLink(link, 0), shortUrl: shortUrlFor(alias) }
}

export async function deleteLinkAction(id: string) {
  const user = await requireUser()
  await prisma.link.deleteMany({ where: { id, userId: user.id } })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/links')
  return { ok: true }
}

const campaignSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
})

export async function createCampaignAction(input: z.infer<typeof campaignSchema>) {
  const user = await requireUser()
  const data = campaignSchema.parse(input)
  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      description: data.description || null,
      userId: user.id,
    },
  })
  revalidatePath('/dashboard/campaigns')
  return { campaign }
}

export async function deleteCampaignAction(id: string) {
  const user = await requireUser()
  await prisma.campaign.deleteMany({ where: { id, userId: user.id } })
  revalidatePath('/dashboard/campaigns')
  return { ok: true }
}

export async function createQRCodeAction(linkId: string) {
  const user = await requireUser()
  const link = await prisma.link.findFirst({ where: { id: linkId, userId: user.id } })
  if (!link) return { error: 'Link not found' }

  const existing = await prisma.qRCode.findFirst({ where: { linkId, userId: user.id } })
  if (existing) return { qr: existing, dataUrl: await QRCode.toDataURL(shortUrlFor(link.alias)) }

  const qr = await prisma.qRCode.create({
    data: { linkId, userId: user.id },
  })
  revalidatePath('/dashboard/qr-codes')
  return { qr, dataUrl: await QRCode.toDataURL(shortUrlFor(link.alias)) }
}

export async function getQRDataUrlAction(qrId: string) {
  const user = await requireUser()
  const qr = await prisma.qRCode.findFirst({
    where: { id: qrId, userId: user.id },
    include: { link: true },
  })
  if (!qr) return { error: 'QR not found' }
  return { dataUrl: await QRCode.toDataURL(shortUrlFor(qr.link.alias)) }
}

export async function createReportAction(name: string, type = 'performance') {
  const user = await requireUser()
  const report = await prisma.report.create({
    data: { name, type, userId: user.id },
  })
  revalidatePath('/dashboard/reports')
  return { report }
}

export async function deleteReportAction(id: string) {
  const user = await requireUser()
  await prisma.report.deleteMany({ where: { id, userId: user.id } })
  revalidatePath('/dashboard/reports')
  return { ok: true }
}

const teamSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
})

export async function inviteTeamMemberAction(input: z.infer<typeof teamSchema>) {
  const user = await requireUser()
  const data = teamSchema.parse(input)
  try {
    const member = await prisma.teamMember.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        userId: user.id,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.email)}`,
      },
    })
    revalidatePath('/dashboard/team')
    return { member }
  } catch {
    return { error: 'That email is already on your team' }
  }
}

export async function removeTeamMemberAction(id: string) {
  const user = await requireUser()
  await prisma.teamMember.deleteMany({ where: { id, userId: user.id } })
  revalidatePath('/dashboard/team')
  return { ok: true }
}

export async function updateProfileAction(input: {
  name: string
  workspaceName: string
}) {
  const user = await requireUser()
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: input.name.trim(),
      workspaceName: input.workspaceName.trim() || 'My Workspace',
    },
  })
  revalidatePath('/dashboard/settings')
  return { user: updated }
}

export async function refreshInsightsAction() {
  const user = await requireUser()
  const insights = await generateInsightsForUser(user.id)
  revalidatePath('/dashboard/ai-insights')
  return {
    insights: insights.map((i) => ({
      ...i,
      actionItems: JSON.parse(i.actionItems) as string[],
    })),
  }
}

export async function upgradePlanAction(plan: 'free' | 'pro' | 'business') {
  const user = await requireUser()
  await prisma.user.update({
    where: { id: user.id },
    data: { plan },
  })
  revalidatePath('/dashboard/billing')
  return { ok: true, plan }
}

export async function askInsightAction(question: string) {
  const user = await requireUser()
  const q = question.trim()
  if (!q) return { error: 'Ask a question about your performance' }

  const insights = await generateInsightsForUser(user.id)
  const answer =
    insights[0]?.description ||
    'Create and share more links so Analytivo can answer performance questions with real data.'

  return {
    answer,
    insights: insights.map((i) => ({
      ...i,
      actionItems: JSON.parse(i.actionItems) as string[],
    })),
  }
}
