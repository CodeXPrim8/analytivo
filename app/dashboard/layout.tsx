import { requireWorkspace } from '@/lib/workspace'
import { DashboardShell } from '@/components/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requireWorkspace()

  return (
    <DashboardShell
      workspaces={ctx.workspaces}
      activeOwnerId={ctx.ownerId}
      workspaceName={ctx.workspaceName}
      role={ctx.role}
    >
      {children}
    </DashboardShell>
  )
}
