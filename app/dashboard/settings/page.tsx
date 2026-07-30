import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { SettingsForm } from '@/components/SettingsForm'

export default async function SettingsPage() {
  const user = await requireUser()
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })

  return (
    <SettingsForm
      initial={{
        name: dbUser.name,
        email: dbUser.email,
        workspaceName: dbUser.workspaceName,
        image: dbUser.image,
      }}
    />
  )
}
