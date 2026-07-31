'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { signOut } from '@/lib/auth-client'

export default function LoginPage() {
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [remember, setRemember] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [destination, setDestination] = useState('/dashboard')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const invite = params.get('invite')
    const next = params.get('next')
    if (invite) setDestination(`/invite/${invite}`)
    else if (next?.startsWith('/')) setDestination(next)

    if (params.get('error') === 'session-expired') {
      void signOut().finally(() => {
        setError('Your previous session is no longer valid. Please sign in again.')
        window.history.replaceState({}, '', invite ? `/login?invite=${invite}` : '/login')
      })
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(formData.email, formData.password)
      // Full navigation so the new session cookie is always sent to the server.
      window.location.assign(destination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your Analytivo account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium">Password</label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot?
          </Link>
        </div>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-border cursor-pointer"
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Remember me
          </label>
        </div>

        <Button type="submit" disabled={submitting} className="w-full font-semibold py-2">
          {submitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href={destination.startsWith('/invite/') ? `/signup?invite=${destination.slice(8)}` : '/signup'}
          className="text-primary hover:underline font-medium"
        >
          Sign up
        </Link>
      </p>
    </motion.div>
  )
}
