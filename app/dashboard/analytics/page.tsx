import { AnalyticsChart } from '@/components/AnalyticsChart'
import { requireUser } from '@/lib/session'
import {
  getClickTrends,
  getDeviceBreakdown,
  getTrafficSources,
  getLinkStats,
} from '@/lib/analytics'
import { formatNumber } from '@/lib/utils-helpers'

export default async function AnalyticsPage() {
  const user = await requireUser()
  const [trends, sources, devices, stats] = await Promise.all([
    getClickTrends(user.id, 30),
    getTrafficSources(user.id),
    getDeviceBreakdown(user.id),
    getLinkStats(user.id),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          {formatNumber(stats.totalClicks)} clicks · {formatNumber(stats.uniqueVisitors)} unique
          visitors · {formatNumber(stats.returningVisitors)} returning
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <AnalyticsChart
          title="Clicks (30 days)"
          data={trends}
          type="line"
          dataKey="clicks"
          color="#7c3aed"
        />
        <AnalyticsChart
          title="Traffic sources"
          data={sources.map((s) => ({ date: s.source, clicks: s.clicks }))}
          type="bar"
          dataKey="clicks"
          color="#06b6d4"
        />
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Devices</h2>
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Share a link to populate device analytics.</p>
        ) : (
          <div className="space-y-3">
            {devices.map((d) => (
              <div key={d.device} className="flex justify-between text-sm">
                <span className="capitalize">{d.device}</span>
                <span>
                  {d.clicks} · {d.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
