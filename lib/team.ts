import { customAlphabet } from 'nanoid'
import { prisma } from '@/lib/db'
import { appBaseUrl } from '@/lib/links'
import type { WorkspaceRole } from '@/lib/workspace'

const tokenId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 40)

export type MemberRole = Exclude<WorkspaceRole, 'owner'>

export type TeamMemberView = {
  id: string
  name: string
  email: string
  role: MemberRole
  avatar?: string
  /** "suspended" means a downgrade took the seat away; the record is kept. */
  status: 'pending' | 'active' | 'suspended'
  inviteUrl?: string
  invitedAt: Date
  joinedAt: Date
  acceptedAt?: Date
  isYou: boolean
}

export function newInviteToken() {
  return tokenId()
}

export function inviteUrlFor(token: string) {
  return `${appBaseUrl()}/invite/${token}`
}

export function avatarFor(email: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function listTeamMembers(ownerId: string, viewerId: string): Promise<TeamMemberView[]> {
  const members = await prisma.teamMember.findMany({
    where: { userId: ownerId },
    orderBy: [{ status: 'asc' }, { invitedAt: 'desc' }],
  })

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: (m.role as MemberRole) || 'viewer',
    avatar: m.avatar || undefined,
    status:
      m.status === 'active' ? 'active' : m.status === 'suspended' ? 'suspended' : 'pending',
    // A suspended invite must not be shareable, or it would restore a seat the
    // plan no longer includes.
    inviteUrl: m.status === 'pending' && m.inviteToken ? inviteUrlFor(m.inviteToken) : undefined,
    invitedAt: m.invitedAt,
    joinedAt: m.joinedAt,
    acceptedAt: m.acceptedAt || undefined,
    isYou: Boolean(m.memberUserId && m.memberUserId === viewerId),
  }))
}

/** Invite details shown on the public accept page. */
export async function getInviteByToken(token: string) {
  if (!token) return null
  const invite = await prisma.teamMember.findUnique({
    where: { inviteToken: token },
    include: {
      user: { select: { id: true, name: true, email: true, workspaceName: true } },
    },
  })
  if (!invite) return null

  return {
    id: invite.id,
    email: invite.email,
    name: invite.name,
    role: (invite.role as MemberRole) || 'viewer',
    status: invite.status === 'active' ? ('active' as const) : ('pending' as const),
    workspaceName: invite.user.workspaceName,
    inviterName: invite.user.name,
    ownerId: invite.user.id,
    ownerEmail: invite.user.email,
  }
}
