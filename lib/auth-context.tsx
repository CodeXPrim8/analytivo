'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSession, signIn, signUp, signOut } from '@/lib/auth-client'

interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  workspaceName?: string | null
  plan?: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, workspaceName?: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
        workspaceName: (session.user as { workspaceName?: string }).workspaceName,
        plan: (session.user as { plan?: string }).plan,
      }
    : null

  const login = async (email: string, password: string) => {
    const result = await signIn.email({ email, password })
    if (result.error) {
      throw new Error(result.error.message || 'Invalid email or password')
    }
  }

  const signup = async (
    name: string,
    email: string,
    password: string,
    workspaceName = 'My Workspace',
  ) => {
    const result = await signUp.email({
      name,
      email,
      password,
      // @ts-expect-error additional field defined in auth config
      workspaceName,
    })
    if (result.error) {
      throw new Error(result.error.message || 'Could not create account')
    }
  }

  const logout = async () => {
    await signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isPending,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
