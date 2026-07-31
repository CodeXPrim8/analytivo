import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'

/** Which workspace the signed-in user is currently viewing. */
export const WORKSPACE_COOKIE = 'analytivo_ws'

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer'

const RANK: Record<WorkspaceRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
}

export function roleAtLeast(role: WorkspaceRole, minimum: WorkspaceRole) {
  return RANK[role] >= RANK[minimum]
}

export type WorkspaceSummary = {
  ownerId: string
  name: string
  role: WorkspaceRole
  ownerName: string
  ownerEmail: string
}

export type WorkspaceContext = {
  user: { id: string; name: string; email: string }
  /** Owner of the active workspace — every record is stored against this id. */
  ownerId: string
  role: WorkspaceRole
  isOwner: boolean
  workspaceName: string
  workspaces: WorkspaceSummary[]
}

/** The user's own workspace first, then every workspace they have accepted an invite to. */
export async function listWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]> {
  const [self, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, workspaceName: true },
    }),
    prisma.teamMember.findMany({
      where: { memberUserId: userId, status: 'active' },
      orderBy: { acceptedAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true, workspaceName: true } },
      },
    }),
  ])

  const workspaces: WorkspaceSummary[] = []

  if (self) {
    workspaces.push({
      ownerId: self.id,
      name: self.workspaceName,
      role: 'owner',
      ownerName: self.name,
      ownerEmail: self.email,
    })
  }

  for (const membership of memberships) {
    if (membership.user.id === userId) continue
    workspaces.push({
      ownerId: membership.user.id,
      name: membership.user.workspaceName,
      role: (membership.role as WorkspaceRole) || 'viewer',
      ownerName: membership.user.name,
      ownerEmail: membership.user.email,
    })
  }

  return workspaces
}

export async function requireWorkspace(): Promise<WorkspaceContext> {
  const user = await requireUser()
  const workspaces = await listWorkspacesForUser(user.id)

  const store = await cookies()
  const requested = store.get(WORKSPACE_COOKIE)?.value
  // Falling back to the first entry keeps a revoked member on their own workspace.
  const active = workspaces.find((w) => w.ownerId === requested) || workspaces[0]

  return {
    user: { id: user.id, name: user.name, email: user.email },
    ownerId: active?.ownerId ?? user.id,
    role: active?.role ?? 'owner',
    isOwner: (active?.ownerId ?? user.id) === user.id,
    workspaceName: active?.name ?? 'My Workspace',
    workspaces,
  }
}

/** Returns an error message when the active role is below `minimum`, otherwise null. */
export function denyUnlessRole(ctx: WorkspaceContext, minimum: WorkspaceRole): string | null {
  if (roleAtLeast(ctx.role, minimum)) return null
  const needed = minimum === 'owner' ? 'the workspace owner' : `${minimum} access`
  return `You need ${needed} to do that.`
}

export async function requireWorkspaceRole(minimum: WorkspaceRole) {
  const ctx = await requireWorkspace()
  return { ctx, error: denyUnlessRole(ctx, minimum) }
}
