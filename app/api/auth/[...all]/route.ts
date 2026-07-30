import { auth } from '@/lib/auth'
import { ensureDatabase } from '@/lib/db'
import { toNextJsHandler } from 'better-auth/next-js'

const handlers = toNextJsHandler(auth)

async function withDb(request: Request, method: 'GET' | 'POST') {
  try {
    await ensureDatabase()
    return method === 'GET' ? handlers.GET(request) : handlers.POST(request)
  } catch (error) {
    console.error('[auth]', error)
    return Response.json(
      {
        error: 'AUTH_BACKEND_ERROR',
        message: error instanceof Error ? error.message : 'Authentication service unavailable',
      },
      { status: 500 },
    )
  }
}

export const GET = (request: Request) => withDb(request, 'GET')
export const POST = (request: Request) => withDb(request, 'POST')
