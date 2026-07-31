import Link from 'next/link'
import { getSession } from '@/lib/session'
import { getInviteByToken } from '@/lib/team'
import { BrandLogo } from '@/components/BrandLogo'
import { Button } from '@/components/ui/button'
import { InviteAccept } from '@/components/InviteAccept'

export const dynamic = 'force-dynamic'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 font-bold mb-8">
          <BrandLogo size={48} />
          <span className="text-xl">Analytivo</span>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-8">{children}</div>
      </div>
    </div>
  )
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [invite, session] = await Promise.all([getInviteByToken(token), getSession()])

  if (!invite || invite.status === 'active') {
    return (
      <Shell>
        <h1 className="text-2xl font-bold mb-2">Invitation not available</h1>
        <p className="text-muted-foreground text-sm mb-6">
          This link has expired, was cancelled, or has already been used.
        </p>
        <Button asChild className="w-full">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </Shell>
    )
  }

  const viewerEmail = session?.user?.email?.toLowerCase()
  const matches = viewerEmail === invite.email.toLowerCase()

  return (
    <Shell>
      <h1 className="text-2xl font-bold mb-2">Join {invite.workspaceName}</h1>
      <p className="text-muted-foreground text-sm mb-6">
        <strong className="text-foreground">{invite.inviterName}</strong> invited{' '}
        <strong className="text-foreground">{invite.email}</strong> to collaborate as{' '}
        <strong className="text-foreground">{invite.role}</strong>.
      </p>

      {!session?.user ? (
        <div className="space-y-3">
          <Button asChild className="w-full font-semibold">
            <Link href={`/signup?invite=${token}`}>Create an account to join</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/login?invite=${token}`}>I already have an account</Link>
          </Button>
        </div>
      ) : matches ? (
        <InviteAccept token={token} workspaceName={invite.workspaceName} />
      ) : (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 text-sm">
            You&apos;re signed in as {session.user.email}, but this invitation is for{' '}
            {invite.email}. Sign out and sign in with that address to accept it.
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/login?invite=${token}`}>Switch account</Link>
          </Button>
        </div>
      )}
    </Shell>
  )
}
