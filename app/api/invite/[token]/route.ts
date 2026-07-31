import { NextResponse } from 'next/server'
import { getInviteByToken } from '@/lib/team'

/** Public lookup so the login/signup screens can show what the visitor is joining. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params
  const invite = await getInviteByToken(token)

  if (!invite || invite.status === 'active') {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }

  return NextResponse.json({
    email: invite.email,
    name: invite.name,
    role: invite.role,
    workspaceName: invite.workspaceName,
    inviterName: invite.inviterName,
  })
}
