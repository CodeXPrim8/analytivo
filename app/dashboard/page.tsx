import Link from 'next/link'
import { BarChart3, Users, TrendingUp, Percent } from 'lucide-react'
import { KPICard } from '@/components/KPICard'
import { AnalyticsChart } from '@/components/AnalyticsChart'
import { StatBarList } from '@/components/StatBarList'
import { requireUser } from '@/lib/session'
import { getDashboardOverview } from '@/lib/analytics'
import { formatNumber, formatRelativeTime } from '@/lib/utils-helpers'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const user = await requireUser()
  const overview = await getDashboardOverview(user.id)

  return (
    <div className="min-h-screen">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Track your performance at a glance</p>
        </div>
        <Button asChild className="font-semibold">
          <Link href="/dashboard/links">Create Link</Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Clicks"
          value={formatNumber(overview.totalClicks)}
          change={overview.changes.totalClicks}
          changeLabel={overview.changeLabel}
          icon={<BarChart3 size={20} style={{ color: '#7c3aed' }} />}
          color="#7c3aed"
        />
        <KPICard
          title="Unique Visitors"
          value={formatNumber(overview.uniqueVisitors)}
          change={overview.changes.uniqueVisitors}
          changeLabel={overview.changeLabel}
          icon={<Users size={20} style={{ color: '#06b6d4' }} />}
          color="#06b6d4"
        />
        <KPICard
          title="Returning Visitors"
          value={formatNumber(overview.returningVisitors)}
          change={overview.changes.returningVisitors}
          changeLabel={overview.changeLabel}
          icon={<TrendingUp size={20} style={{ color: '#10b981' }} />}
          color="#10b981"
        />
        <KPICard
          title="Return Rate"
          value={`${overview.conversionRate.toFixed(1)}%`}
          change={overview.changes.returnRate}
          changeLabel={overview.changeLabel}
          icon={<Percent size={20} style={{ color: '#f59e0b' }} />}
          color="#f59e0b"
        />
      </div>

      <div className="mb-8">
        <AnalyticsChart
          title="Click Trends (14 days)"
          data={overview.clickTrends}
          type="line"
          dataKey="clicks"
          color="#7c3aed"
          emptyMessage="No clicks in the last 14 days. Share a short link to see trends here."
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <StatBarList
          title="Traffic Sources"
          items={overview.trafficSources.map((s) => ({
            label: s.source,
            value: s.clicks,
            percentage: s.percentage,
          }))}
          emptyMessage="No traffic yet. Sources appear once people click your links."
        />
        <StatBarList
          title="Device Breakdown"
          items={overview.deviceBreakdown.map((d) => ({
            label: d.device,
            value: d.clicks,
            percentage: d.percentage,
          }))}
          emptyMessage="No clicks yet. Devices appear once people open your links."
        />
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Links</h2>
        {overview.recentLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No links yet.{' '}
            <Link href="/dashboard/links" className="text-primary hover:underline">
              Create your first link
            </Link>{' '}
            to start collecting clicks.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="font-medium py-3 pr-4">Link</th>
                  <th className="font-medium py-3 pr-4">Clicks</th>
                  <th className="font-medium py-3 pr-4">Unique</th>
                  <th className="font-medium py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentLinks.map((link) => (
                  <tr key={link.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4 min-w-0 max-w-xs">
                      <p className="font-semibold truncate">{link.title}</p>
                      <p className="text-xs text-accent truncate">{link.shortUrl}</p>
                    </td>
                    <td className="py-3 pr-4 font-semibold">{formatNumber(link.clickCount)}</td>
                    <td className="py-3 pr-4 font-semibold">{formatNumber(link.uniqueClicks)}</td>
                    <td className="py-3 text-muted-foreground">
                      {formatRelativeTime(new Date(link.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
