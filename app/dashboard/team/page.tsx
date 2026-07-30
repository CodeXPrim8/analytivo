import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { TeamManager } from '@/components/TeamManager'

export default async function TeamPage() {
  const user = await requireUser()
  const members = await prisma.teamMember.findMany({
    where: { userId: user.id },
    orderBy: { joinedAt: 'desc' },
  })

  return (
    <TeamManager
      initialMembers={members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role as 'admin' | 'editor' | 'viewer',
        avatar: m.avatar || undefined,
        joinedAt: m.joinedAt,
      }))}
    />
  )
}
