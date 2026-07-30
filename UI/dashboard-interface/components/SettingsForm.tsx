'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { updateProfileAction } from '@/lib/actions'
import { authClient } from '@/lib/auth-client'

export function SettingsForm({
  initial,
}: {
  initial: { name: string; email: string; workspaceName: string }
}) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [password, setPassword] = useState({ current: '', next: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    startTransition(async () => {
      await updateProfileAction({
        name: form.name,
        workspaceName: form.workspaceName,
      })
      setMessage('Profile saved')
      router.refresh()
    })
  }

  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    startTransition(async () => {
      const result = await authClient.changePassword({
        currentPassword: password.current,
        newPassword: password.next,
      })
      if (result.error) {
        setError(result.error.message || 'Could not update password')
        return
      }
      setPassword({ current: '', next: '' })
      setMessage('Password updated')
    })
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and workspace</p>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={saveProfile} className="mb-8 space-y-4 rounded-xl border border-border bg-card/50 p-6">
        <h2 className="font-semibold">Account</h2>
        <div>
          <label className="block text-sm mb-2">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Email</label>
          <input
            value={form.email}
            disabled
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-muted-foreground"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Workspace</label>
          <input
            value={form.workspaceName}
            onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>
        <Button type="submit" disabled={pending}>
          Save changes
        </Button>
      </form>

      <form onSubmit={updatePassword} className="space-y-4 rounded-xl border border-border bg-card/50 p-6">
        <h2 className="font-semibold">Password</h2>
        <div>
          <label className="block text-sm mb-2">Current password</label>
          <input
            type="password"
            required
            value={password.current}
            onChange={(e) => setPassword({ ...password, current: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password.next}
            onChange={(e) => setPassword({ ...password, next: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>
        <Button type="submit" disabled={pending}>
          Update password
        </Button>
      </form>
    </div>
  )
}
