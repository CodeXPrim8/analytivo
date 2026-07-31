'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createCampaignAction, deleteCampaignAction } from '@/lib/actions'
import { formatNumber } from '@/lib/utils-helpers'

type CampaignCard = {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed'
  totalClicks: number
  uniqueVisitors: number
  linkCount: number
  startDate: Date
}

export function CampaignsManager({
  initialCampaigns,
  canEdit = true,
}: {
  initialCampaigns: CampaignCard[]
  canEdit?: boolean
}) {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', description: '' })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await createCampaignAction(form)
      if (result.campaign) {
        setCampaigns((prev) => [
          {
            id: result.campaign.id,
            name: result.campaign.name,
            description: result.campaign.description || undefined,
            status: 'active',
            totalClicks: 0,
            uniqueVisitors: 0,
            linkCount: 0,
            startDate: result.campaign.startDate,
          },
          ...prev,
        ])
        setForm({ name: '', description: '' })
        setOpen(false)
        router.refresh()
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteCampaignAction(id)
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Campaigns</h1>
          <p className="text-muted-foreground">Group links and compare channel performance</p>
        </div>
        {canEdit && (
          <Button className="gap-2 font-semibold" onClick={() => setOpen(true)}>
            <Plus size={18} />
            New Campaign
          </Button>
        )}
      </div>

      {open && canEdit && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-border bg-card/50 p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Create campaign</h2>
            <button type="button" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Campaign name"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background min-h-24"
          />
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Create'}
          </Button>
        </form>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {campaigns.length === 0 ? (
          <p className="text-muted-foreground">No campaigns yet.</p>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-xl border border-border bg-card/50 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{campaign.status}</p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {campaign.description && (
                <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>
              )}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Clicks</p>
                  <p className="font-medium">{formatNumber(campaign.totalClicks)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Uniques</p>
                  <p className="font-medium">{formatNumber(campaign.uniqueVisitors)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Links</p>
                  <p className="font-medium">{campaign.linkCount}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
