import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from '@/lib/db'

function hostFromUrl(value?: string | null) {
  if (!value) return null
  try {
    return new URL(value).host
  } catch {
    return null
  }
}

function appFallbackUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/$/, '')
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

/** Domains pointed at this app (signup/login must trust each origin). */
const APP_HOSTS = [
  'analytivo.net',
  'www.analytivo.net',
  'analytivo.xyz',
  'www.analytivo.xyz',
  'analytivo.com.ng',
  'www.analytivo.com.ng',
  'analytivo.top',
  'www.analytivo.top',
  'analytivo.vercel.app',
]

const fallbackURL = appFallbackUrl()

const allowedHosts = Array.from(
  new Set(
    [
      'localhost:3000',
      '*.vercel.app',
      ...APP_HOSTS,
      hostFromUrl(process.env.BETTER_AUTH_URL),
      hostFromUrl(process.env.NEXT_PUBLIC_APP_URL),
      ...(process.env.AUTH_ALLOWED_HOSTS?.split(',').map((h) => h.trim()).filter(Boolean) ?? []),
    ].filter(Boolean) as string[],
  ),
)

const trustedOrigins = Array.from(
  new Set(
    [
      fallbackURL,
      'http://localhost:3000',
      ...APP_HOSTS.map((host) => `https://${host}`),
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, ''),
      process.env.BETTER_AUTH_URL?.replace(/\/$/, ''),
      ...(process.env.AUTH_TRUSTED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
    ].filter(Boolean) as string[],
  ),
)

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || 'analytivo-dev-secret-change-me-32c',
  baseURL: {
    allowedHosts,
    fallback: fallbackURL,
    protocol: 'auto',
  },
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      workspaceName: {
        type: 'string',
        required: false,
        defaultValue: 'My Workspace',
        input: true,
      },
      plan: {
        type: 'string',
        required: false,
        defaultValue: 'free',
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
