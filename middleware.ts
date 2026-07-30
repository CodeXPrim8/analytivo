import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)
  const { pathname } = request.nextUrl

  // Only gate the dashboard. Do NOT bounce /login → /dashboard on cookie presence:
  // on Vercel the cookie can outlive the ephemeral SQLite session and cause a redirect loop.
  if (pathname.startsWith('/dashboard') && !sessionCookie) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
