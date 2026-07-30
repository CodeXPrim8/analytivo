import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ensureDatabase } from '@/lib/db'

export async function getSession() {
  await ensureDatabase()
  try {
    return await auth.api.getSession({
      headers: await headers(),
    })
  } catch {
    return null
  }
}

export async function requireUser() {
  const session = await getSession()
  if (!session?.user) {
    // Cookie present but DB session missing (stale SQLite-era cookies, secret mismatch, etc.)
    redirect('/login?error=session-expired')
  }
  return session.user
}
