'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

type InvitePreview = {
  email: string
  name: string
  role: string
  workspaceName: string
  inviterName: string
}

export default function SignupPage() {
  const { signup } = useAuth()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', workspace: '' })
  const [error, setError] = useState('')
  const [agree, setAgree] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [inviteToken, setInviteToken] = useState('')
  const [invite, setInvite] = useState<InvitePreview | null>(null)

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('invite')
    if (!token) return
    setInviteToken(token)

    fetch(`/api/invite/${token}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: InvitePreview | null) => {
        if (!data) return
        setInvite(data)
        setFormData((prev) => ({
          ...prev,
          email: data.email,
          name: prev.name || data.name,
          workspace: prev.workspace || `${data.name}'s Workspace`,
        }))
      })
      .catch(() => undefined)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!agree) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setSubmitting(true)
    try {
      await signup(formData.name, formData.email, formData.password, formData.workspace)
      window.location.assign(inviteToken ? `/invite/${inviteToken}` : '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create your account</h1>
        <p className="text-muted-foreground">Start tracking your video links in minutes</p>
      </div>

      {invite && (
        <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
          <strong>{invite.inviterName}</strong> invited you to join{' '}
          <strong>{invite.workspaceName}</strong> as {invite.role}. Create your account to accept.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            readOnly={Boolean(invite)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 read-only:opacity-70"
          />
          {invite && (
            <p className="mt-1 text-xs text-muted-foreground">
              The invitation is tied to this address.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Workspace Name</label>
          <input
            type="text"
            name="workspace"
            value={formData.workspace}
            onChange={handleChange}
            placeholder="My Content Studio"
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="agree"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border cursor-pointer"
          />
          <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer">
            I agree to the{' '}
            <Link href="#" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button type="submit" disabled={submitting} className="w-full font-semibold py-2">
          {submitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={inviteToken ? `/login?invite=${inviteToken}` : '/login'}
          className="text-primary hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
