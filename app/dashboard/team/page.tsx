import { requireWorkspace } from '@/lib/workspace'
import { prisma } from '@/lib/db'
import { listTeamMembers } from '@/lib/team'
import { emailEnabled } from '@/lib/email'
import { TeamManager } from '@/components/TeamManager'

export default async function TeamPage() {
  const ctx = await requireWorkspace()
  const [members, owner] = await Promise.all([
    listTeamMembers(ctx.ownerId, ctx.user.id),
    prisma.user.findUniqueOrThrow({
      where: { id: ctx.ownerId },
      select: { id: true, name: true, email: true, image: true },
    }),
  ])

  return (
    <TeamManager
      initialMembers={members}
      owner={owner}
      workspaceName={ctx.workspaceName}
      role={ctx.role}
      emailConfigured={emailEnabled()}
      isOwner={ctx.isOwner}
      seats={{
        // listTeamMembers excludes the owner, who always occupies a seat.
        used: members.length + 1,
        total: ctx.capabilities.teamSeats,
      }}
    />
  )
}
