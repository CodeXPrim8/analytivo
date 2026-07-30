'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { updateProfileAction } from '@/lib/actions'
import { authClient } from '@/lib/auth-client'

async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, or WebP)')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5MB')
  }

  const bitmap = await createImageBitmap(file)
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process image')

  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const w = bitmap.width * scale
  const h = bitmap.height * scale
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', 0.85)
}

export function SettingsForm({
  initial,
}: {
  initial: { name: string; email: string; workspaceName: string; image: string | null }
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(initial)
  const [preview, setPreview] = useState(initial.image)
  const [password, setPassword] = useState({ current: '', next: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(form.email)}`

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    startTransition(async () => {
      const result = await updateProfileAction({
        name: form.name,
        workspaceName: form.workspaceName,
        image: preview,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      // Keep Better Auth client session in sync with the new photo/name.
      await authClient.updateUser({
        name: form.name,
        image: preview || undefined,
      })
      setMessage('Profile saved')
      router.refresh()
    })
  }

  const onPickImage = async (file: File | null) => {
    if (!file) return
    setError('')
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      setPreview(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read image')
    }
  }

  const removeImage = () => {
    setPreview(null)
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
        <p className="text-muted-foreground">Manage your account, photo, and workspace</p>
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
        <h2 className="font-semibold">Profile</h2>

        <div className="flex items-center gap-4">
          <img
            src={preview || fallbackAvatar}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border border-border bg-muted"
          />
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => void onPickImage(e.target.files?.[0] || null)}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                Upload photo / logo
              </Button>
              {preview && (
                <Button type="button" variant="outline" onClick={removeImage}>
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG, or WebP. Cropped to a square automatically.</p>
          </div>
        </div>

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
