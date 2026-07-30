import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ensureDatabase } from '@/lib/db'

export async function getSession() {
  await ensureDatabase()
  return auth.api.getSession({
    headers: await headers(),
  })
}

export async function requireUser() {
  const session = await getSession()
  if (!session?.user) {
    redirect('/login?error=session-expired')
  }
  return session.user
}
