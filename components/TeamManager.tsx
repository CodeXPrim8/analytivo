'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Copy, Check, Send, LogOut, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoleBadge } from '@/components/DashboardShell'
import { UpgradeNotice } from '@/components/UpgradeNotice'
import {
  inviteTeamMemberAction,
  removeTeamMemberAction,
  resendInviteAction,
  updateTeamMemberRoleAction,
  leaveWorkspaceAction,
} from '@/lib/actions'
import { formatRelativeTime } from '@/lib/utils-helpers'

type MemberRole = 'admin' | 'editor' | 'viewer'

export type Member = {
  id: string
  name: string
  email: string
  role: MemberRole
  avatar?: string
  status: 'pending' | 'active' | 'suspended'
  inviteUrl?: string
  invitedAt: Date
  joinedAt: Date
  isYou: boolean
}

type Props = {
  initialMembers: Member[]
  owner: { id: string; name: string; email: string; image?: string | null }
  workspaceName: string
  role: 'owner' | MemberRole
  emailConfigured: boolean
  isOwner: boolean
  seats: { used: number; total: number }
}

const ROLE_HELP: Record<MemberRole | 'owner', string> = {
  owner: 'Full access, including billing and workspace deletion.',
  admin: 'Everything except billing — can invite and manage teammates.',
  editor: 'Can create and delete links, campaigns, QR codes and reports.',
  viewer: 'Read-only access to analytics and links.',
}

function avatarFor(email: string, avatar?: string | null) {
  return (
    avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`
  )
}

export function TeamManager({
  initialMembers,
  owner,
  workspaceName,
  role,
  emailConfigured,
  isOwner,
  seats,
}: Props) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer' as MemberRole })

  const canManage = role === 'owner' || role === 'admin'
  const seatsFull = seats.used >= seats.total

  const copyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setError('Could not copy — select the link and copy it manually.')
    }
  }

  const invite = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    startTransition(async () => {
      const result = await inviteTeamMemberAction(form)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.member) {
        setMembers((prev) => [
          result.member,
          ...prev.filter((m) => m.email !== result.member.email),
        ])
        setForm({ name: '', email: '', role: 'viewer' })
        setNotice(
          result.emailed
            ? `Invitation emailed to ${result.member.email}.`
            : `Invitation created. Copy the link below and send it to ${result.member.email}.`,
        )
        router.refresh()
      }
    })
  }

  const resend = (id: string) => {
    setError('')
    setNotice('')
    startTransition(async () => {
      const result = await resendInviteAction(id)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.inviteUrl) {
        setMembers((prev) =>
          prev.map((m) => (m.id === id ? { ...m, inviteUrl: result.inviteUrl } : m)),
        )
        setNotice(result.emailed ? 'Invitation re-sent by email.' : 'A fresh invite link is ready.')
      }
      router.refresh()
    })
  }

  const changeRole = (id: string, next: MemberRole) => {
    setError('')
    const previous = members
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: next } : m)))
    startTransition(async () => {
      const result = await updateTeamMemberRoleAction(id, next)
      if (result.error) {
        setMembers(previous)
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const remove = (id: string) => {
    setError('')
    startTransition(async () => {
      const result = await removeTeamMemberAction(id)
      if (result.error) {
        setError(result.error)
        return
      }
      setMembers((prev) => prev.filter((m) => m.id !== id))
      router.refresh()
    })
  }

  const leave = () => {
    startTransition(async () => {
      const result = await leaveWorkspaceAction(owner.id)
      if (result.error) {
        setError(result.error)
        return
      }
      router.push('/dashboard')
      router.refresh()
    })
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Team</h1>
          <p className="text-muted-foreground">
            {canManage
              ? `Invite collaborators to ${workspaceName}`
              : `People with access to ${workspaceName}`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {seats.used} of {seats.total} seat{seats.total === 1 ? '' : 's'} used
          </p>
        </div>
        {role !== 'owner' && (
          <Button variant="outline" onClick={leave} disabled={pending} className="gap-2">
            <LogOut size={16} />
            Leave workspace
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>
      )}
      {notice && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">
          {notice}
        </div>
      )}

      {canManage && seatsFull && (
        <UpgradeNotice
          className="mb-6"
          title={
            seats.total <= 1
              ? 'Your plan includes a single seat'
              : `All ${seats.total} seats are in use`
          }
          description={
            seats.total <= 1
              ? 'The Free plan covers you alone. Upgrade to Pro for 5 seats and invite collaborators into this workspace.'
              : 'Upgrade for more seats, or remove a member below to free one up.'
          }
          isOwner={isOwner}
        />
      )}

      {canManage && !seatsFull && (
        <>
          {!emailConfigured && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-400 text-sm">
              <Mail size={16} className="mt-0.5 shrink-0" />
              <span>
                Email delivery isn&apos;t configured, so invites won&apos;t be sent automatically.
                Copy each invite link and share it yourself. Add <code>RESEND_API_KEY</code> to send
                real emails.
              </span>
            </div>
          )}

          <form onSubmit={invite} className="mb-6 grid md:grid-cols-4 gap-3">
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
              onChange={(e) => setForm({ ...form, role: e.target.value as MemberRole })}
              className="px-3 py-2 rounded-lg border border-border bg-background"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <Button type="submit" disabled={pending} className="gap-2">
              <Plus size={16} />
              Send invite
            </Button>
            <p className="md:col-span-4 text-xs text-muted-foreground">{ROLE_HELP[form.role]}</p>
          </form>
        </>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={avatarFor(owner.email, owner.image)}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="font-medium truncate">{owner.name}</p>
              <p className="text-xs text-muted-foreground truncate">{owner.email}</p>
            </div>
          </div>
          <RoleBadge role="owner" />
        </div>

        {members.map((member) => (
          <div
            key={member.id}
            className="rounded-xl border border-border bg-card/50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={avatarFor(member.email, member.avatar)}
                  alt=""
                  className={`w-10 h-10 rounded-full object-cover ${
                    member.status === 'pending' ? 'opacity-50' : ''
                  }`}
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {member.name}
                    {member.isYou && <span className="text-muted-foreground"> (you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email} ·{' '}
                    {member.status === 'active'
                      ? `joined ${formatRelativeTime(new Date(member.joinedAt))}`
                      : member.status === 'suspended'
                        ? 'no seat available on this plan'
                        : `invited ${formatRelativeTime(new Date(member.invitedAt))}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    member.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : member.status === 'suspended'
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-amber-500/15 text-amber-400'
                  }`}
                >
                  {member.status === 'active'
                    ? 'Active'
                    : member.status === 'suspended'
                      ? 'Suspended'
                      : 'Pending'}
                </span>

                {canManage ? (
                  <select
                    value={member.role}
                    onChange={(e) => changeRole(member.id, e.target.value as MemberRole)}
                    disabled={pending}
                    className="px-2 py-1 rounded-lg border border-border bg-background text-xs"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <RoleBadge role={member.role} />
                )}

                {canManage && member.status === 'pending' && (
                  <button
                    onClick={() => resend(member.id)}
                    disabled={pending}
                    title="Resend invite"
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <Send size={16} />
                  </button>
                )}

                {canManage && (
                  <button
                    onClick={() => remove(member.id)}
                    disabled={pending}
                    title={member.status === 'pending' ? 'Cancel invite' : 'Remove member'}
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {canManage && member.status === 'pending' && member.inviteUrl && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <code className="flex-1 text-xs text-accent truncate">{member.inviteUrl}</code>
                <button
                  onClick={() => copyLink(member.inviteUrl!, member.id)}
                  className="p-1.5 hover:bg-muted rounded-md shrink-0"
                  title="Copy invite link"
                >
                  {copied === member.id ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No teammates yet. {canManage ? 'Send an invite to get started.' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
