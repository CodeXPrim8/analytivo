'use client'

import { createAuthClient } from 'better-auth/react'

// Use same-origin in the browser so production never calls localhost.
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : undefined,
})

export const { signIn, signUp, signOut, useSession } = authClient
