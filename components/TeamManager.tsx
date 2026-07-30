'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { inviteTeamMemberAction, removeTeamMemberAction } from '@/lib/actions'
import { formatRelativeTime } from '@/lib/utils-helpers'

type Member = {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
  joinedAt: Date
}

export function TeamManager({ initialMembers }: { initialMembers: Member[] }) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer',
  })

  const invite = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await inviteTeamMemberAction(form)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.member) {
        setMembers((prev) => [
          {
            id: result.member.id,
            name: result.member.name,
            email: result.member.email,
            role: result.member.role as Member['role'],
            avatar: result.member.avatar || undefined,
            joinedAt: result.member.joinedAt,
          },
          ...prev,
        ])
        setForm({ name: '', email: '', role: 'viewer' })
        router.refresh()
      }
    })
  }

  const remove = (id: string) => {
    startTransition(async () => {
      await removeTeamMemberAction(id)
      setMembers((prev) => prev.filter((m) => m.id !== id))
      router.refresh()
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Team</h1>
        <p className="text-muted-foreground">Invite collaborators to your workspace</p>
      </div>

      <form onSubmit={invite} className="mb-6 grid md:grid-cols-4 gap-3">
        {error && (
          <div className="md:col-span-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>
        )}
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
          className="px-3 py-2 rounded-lg border border-border bg-background"
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="px-3 py-2 rounded-lg border border-border bg-background"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as Member['role'] })}
          className="px-3 py-2 rounded-lg border border-border bg-background"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        <Button type="submit" disabled={pending} className="gap-2">
          <Plus size={16} />
          Invite
        </Button>
      </form>

      <div className="space-y-3">
        {members.length === 0 ? (
          <p className="text-muted-foreground">No team members yet.</p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    member.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.email)}`
                  }
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.email} · {member.role} · joined {formatRelativeTime(new Date(member.joinedAt))}
                  </p>
                </div>
              </div>
              <button onClick={() => remove(member.id)} className="p-2 hover:bg-muted rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
