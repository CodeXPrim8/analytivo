import { BarChart3, Users, TrendingUp, Percent } from 'lucide-react'
import { AnalyticsChart } from '@/components/AnalyticsChart'
import { StatBarList } from '@/components/StatBarList'
import { KPICard } from '@/components/KPICard'
import { requireWorkspace } from '@/lib/workspace'
import {
  getClickTrends,
  getDeviceBreakdown,
  getTrafficSources,
  getLinkStats,
  getPeriodComparison,
} from '@/lib/analytics'
import { formatNumber } from '@/lib/utils-helpers'

export default async function AnalyticsPage() {
  const ctx = await requireWorkspace()
  const [trends, sources, devices, stats, period] = await Promise.all([
    getClickTrends(ctx.ownerId, 30),
    getTrafficSources(ctx.ownerId),
    getDeviceBreakdown(ctx.ownerId),
    getLinkStats(ctx.ownerId),
    getPeriodComparison(ctx.ownerId, 7),
  ])

  const returnRate =
    stats.uniqueVisitors > 0
      ? Math.round((stats.returningVisitors / stats.uniqueVisitors) * 1000) / 10
      : 0
  const changeLabel = `vs prior ${period.days} days`

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          {formatNumber(stats.totalClicks)} clicks · {formatNumber(stats.uniqueVisitors)} unique
          visitors · {formatNumber(stats.returningVisitors)} returning
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Clicks"
          value={formatNumber(stats.totalClicks)}
          change={period.changes.totalClicks}
          changeLabel={changeLabel}
          icon={<BarChart3 size={20} style={{ color: '#7c3aed' }} />}
          color="#7c3aed"
        />
        <KPICard
          title="Unique Visitors"
          value={formatNumber(stats.uniqueVisitors)}
          change={period.changes.uniqueVisitors}
          changeLabel={changeLabel}
          icon={<Users size={20} style={{ color: '#06b6d4' }} />}
          color="#06b6d4"
        />
        <KPICard
          title="Returning Visitors"
          value={formatNumber(stats.returningVisitors)}
          change={period.changes.returningVisitors}
          changeLabel={changeLabel}
          icon={<TrendingUp size={20} style={{ color: '#10b981' }} />}
          color="#10b981"
        />
        <KPICard
          title="Return Rate"
          value={`${returnRate.toFixed(1)}%`}
          change={period.changes.returnRate}
          changeLabel={changeLabel}
          icon={<Percent size={20} style={{ color: '#f59e0b' }} />}
          color="#f59e0b"
        />
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

      <StatBarList
        title="Devices"
        items={devices.map((d) => ({
          label: d.device,
          value: d.clicks,
          percentage: d.percentage,
        }))}
        emptyMessage="Share a link to populate device analytics."
      />
    </div>
  )
}
