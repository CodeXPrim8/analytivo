'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createQRCodeAction, getQRDataUrlAction } from '@/lib/actions'

type QRItem = {
  id: string
  linkId: string
  title: string
  shortUrl: string
  scans: number
  createdAt: Date
}

type LinkOption = { id: string; title: string; shortUrl: string }

export function QRCodesManager({
  initialQRCodes,
  links,
  canEdit = true,
}: {
  initialQRCodes: QRItem[]
  links: LinkOption[]
  canEdit?: boolean
}) {
  const router = useRouter()
  const [items, setItems] = useState(initialQRCodes)
  const [linkId, setLinkId] = useState(links[0]?.id || '')
  const [pending, startTransition] = useTransition()
  const [previews, setPreviews] = useState<Record<string, string>>({})

  const handleGenerate = () => {
    if (!linkId) return
    startTransition(async () => {
      const result = await createQRCodeAction(linkId)
      if (result.error) {
        alert(result.error)
        return
      }
      if (result.qr && result.dataUrl) {
        const link = links.find((l) => l.id === linkId)
        setPreviews((prev) => ({ ...prev, [result.qr!.id]: result.dataUrl! }))
        setItems((prev) => {
          if (prev.some((p) => p.id === result.qr!.id)) return prev
          return [
            {
              id: result.qr!.id,
              linkId,
              title: link?.title || 'Link',
              shortUrl: link?.shortUrl || '',
              scans: 0,
              createdAt: result.qr!.createdAt,
            },
            ...prev,
          ]
        })
        router.refresh()
      }
    })
  }

  const handleDownload = (id: string) => {
    startTransition(async () => {
      let dataUrl = previews[id]
      if (!dataUrl) {
        const result = await getQRDataUrlAction(id)
        if (result.error || !result.dataUrl) return
        dataUrl = result.dataUrl
        setPreviews((prev) => ({ ...prev, [id]: dataUrl! }))
      }
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `analytivo-qr-${id}.png`
      a.click()
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">QR Codes</h1>
        <p className="text-muted-foreground">Generate printable codes for offline campaigns</p>
      </div>

      {canEdit && (
        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <select
            value={linkId}
            onChange={(e) => setLinkId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background"
          >
            {links.length === 0 ? (
              <option value="">Create a link first</option>
            ) : (
              links.map((link) => (
                <option key={link.id} value={link.id}>
                  {link.title}
                </option>
              ))
            )}
          </select>
          <Button className="gap-2" onClick={handleGenerate} disabled={!linkId || pending}>
            <Plus size={16} />
            Generate QR
          </Button>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground">No QR codes yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card/50 p-5">
              <div className="aspect-square mb-4 rounded-lg bg-white p-4 flex items-center justify-center">
                {previews[item.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[item.id]} alt="" className="w-full h-full object-contain" />
                ) : (
                  <button
                    className="text-sm text-muted-foreground underline"
                    onClick={() => handleDownload(item.id)}
                  >
                    Load preview
                  </button>
                )}
              </div>
              <h3 className="font-medium mb-1">{item.title}</h3>
              <p className="text-xs text-accent mb-3 break-all">{item.shortUrl}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.scans} scans</span>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => handleDownload(item.id)}>
                  <Download size={14} />
                  Download
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
