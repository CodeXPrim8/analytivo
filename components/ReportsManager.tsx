'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createReportAction, deleteReportAction } from '@/lib/actions'
import { formatRelativeTime } from '@/lib/utils-helpers'

type ReportItem = { id: string; name: string; type: string; createdAt: Date }

export function ReportsManager({
  initialReports,
  canEdit = true,
}: {
  initialReports: ReportItem[]
  canEdit?: boolean
}) {
  const router = useRouter()
  const [reports, setReports] = useState(initialReports)
  const [name, setName] = useState('')
  const [type, setType] = useState('performance')
  const [pending, startTransition] = useTransition()

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await createReportAction(name, type)
      if (result.report) {
        setReports((prev) => [
          {
            id: result.report.id,
            name: result.report.name,
            type: result.report.type,
            createdAt: result.report.createdAt,
          },
          ...prev,
        ])
        setName('')
        router.refresh()
      }
    })
  }

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteReportAction(id)
      setReports((prev) => prev.filter((r) => r.id !== id))
      router.refresh()
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">Save named snapshots of your reporting focus</p>
      </div>

      {canEdit && (
        <form onSubmit={create} className="mb-6 flex flex-col md:flex-row gap-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Report name"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background"
          >
            <option value="performance">Performance</option>
            <option value="audience">Audience</option>
            <option value="conversion">Conversion</option>
            <option value="custom">Custom</option>
          </select>
          <Button type="submit" disabled={pending} className="gap-2">
            <Plus size={16} />
            Generate Report
          </Button>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-6">Name</th>
              <th className="text-left py-3 px-6">Type</th>
              <th className="text-left py-3 px-6">Created</th>
              <th className="text-left py-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  No reports yet.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="border-b border-border/30">
                  <td className="py-4 px-6 font-medium">{report.name}</td>
                  <td className="py-4 px-6 capitalize">{report.type}</td>
                  <td className="py-4 px-6 text-muted-foreground">
                    {formatRelativeTime(new Date(report.createdAt))}
                  </td>
                  <td className="py-4 px-6">
                    {canEdit && (
                      <button
                        onClick={() => remove(report.id)}
                        className="p-2 hover:bg-muted rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
