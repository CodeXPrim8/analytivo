'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Copy, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UpgradeNotice } from '@/components/UpgradeNotice'
import { createLinkAction, deleteLinkAction } from '@/lib/actions'
import { formatNumber, formatRelativeTime } from '@/lib/utils-helpers'
import type { Link } from '@/lib/types'

type CampaignOption = { id: string; name: string }

export function LinksManager({
  initialLinks,
  campaigns,
  canEdit = true,
  quota = null,
  isOwner = true,
}: {
  initialLinks: Link[]
  campaigns: CampaignOption[]
  canEdit?: boolean
  /** null when the plan allows unlimited links. */
  quota?: { used: number; limit: number } | null
  isOwner?: boolean
}) {
  const router = useRouter()
  const [links, setLinks] = useState(initialLinks)
  const [copied, setCopied] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    title: '',
    originalUrl: '',
    alias: '',
    source: 'direct',
    campaignId: '',
  })

  const handleCopy = async (shortUrl: string) => {
    await navigator.clipboard.writeText(shortUrl)
    setCopied(shortUrl)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteLinkAction(id)
      setLinks((prev) => prev.filter((link) => link.id !== id))
      router.refresh()
    })
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await createLinkAction({
        title: form.title,
        originalUrl: form.originalUrl,
        alias: form.alias || undefined,
        source: form.source || undefined,
        campaignId: form.campaignId || undefined,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.link) {
        setLinks((prev) => [result.link as Link, ...prev])
        setForm({ title: '', originalUrl: '', alias: '', source: 'direct', campaignId: '' })
        setOpen(false)
        router.refresh()
      }
    })
  }

  const quotaReached = quota !== null && quota.used >= quota.limit

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Links</h1>
          <p className="text-muted-foreground">Manage and track {links.length} video links</p>
          {quota && (
            <p className="text-sm text-muted-foreground mt-1">
              {quota.used} of {quota.limit} links used this month
            </p>
          )}
        </div>
        {canEdit && !quotaReached && (
          <Button className="gap-2 font-semibold" onClick={() => setOpen(true)}>
            <Plus size={18} />
            Create Link
          </Button>
        )}
      </div>

      {quotaReached && (
        <UpgradeNotice
          className="mb-6"
          title="You've reached this month's link limit"
          description={`The Free plan includes ${quota.limit} new links per calendar month. Upgrade to Pro for unlimited links, or wait until next month.`}
          isOwner={isOwner}
        />
      )}

      {open && canEdit && !quotaReached && (
        <div className="mb-6 rounded-xl border border-border bg-card/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">New trackable link</h2>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            {error && (
              <div className="md:col-span-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm mb-2">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                placeholder="Sunday Service Replay"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Video URL</label>
              <input
                required
                type="url"
                value={form.originalUrl}
                onChange={(e) => setForm({ ...form, originalUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Custom alias (optional)</label>
              <input
                value={form.alias}
                onChange={(e) => setForm({ ...form, alias: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                placeholder="sunday-service"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Source label</label>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                placeholder="whatsapp"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-2">Campaign (optional)</label>
              <select
                value={form.campaignId}
                onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value="">No campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={pending} className="font-semibold">
                {pending ? 'Creating...' : 'Generate Link'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Title</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Short URL</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Clicks</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Created</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-6 text-center text-muted-foreground">
                    {canEdit
                      ? 'No links yet. Create one to start tracking clicks.'
                      : 'No links in this workspace yet.'}
                  </td>
                </tr>
              ) : (
                links.map((link) => (
                  <tr key={link.id} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="py-4 px-6">
                      <p className="font-medium">{link.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{link.source}</p>
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-accent">{link.shortUrl}</td>
                    <td className="py-4 px-6 font-medium">
                      {formatNumber(link.clickCount)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({link.uniqueClicks} unique)
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-xs">
                      {formatRelativeTime(new Date(link.createdAt))}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(link.shortUrl)}
                          className="p-2 hover:bg-muted rounded-lg"
                          title="Copy URL"
                        >
                          {copied === link.shortUrl ? (
                            <Check size={16} className="text-green-400" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="p-2 hover:bg-muted rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
