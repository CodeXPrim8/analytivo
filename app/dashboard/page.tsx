import Link from 'next/link'
import { BarChart3, Users, TrendingUp, Percent } from 'lucide-react'
import { KPICard } from '@/components/KPICard'
import { AnalyticsChart } from '@/components/AnalyticsChart'
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
          icon={<BarChart3 size={20} style={{ color: '#7c3aed' }} />}
          color="#7c3aed"
        />
        <KPICard
          title="Unique Visitors"
          value={formatNumber(overview.uniqueVisitors)}
          icon={<Users size={20} style={{ color: '#06b6d4' }} />}
          color="#06b6d4"
        />
        <KPICard
          title="Returning Visitors"
          value={formatNumber(overview.returningVisitors)}
          icon={<TrendingUp size={20} style={{ color: '#10b981' }} />}
          color="#10b981"
        />
        <KPICard
          title="Return Rate"
          value={`${overview.conversionRate.toFixed(1)}%`}
          icon={<Percent size={20} style={{ color: '#f59e0b' }} />}
          color="#f59e0b"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <AnalyticsChart
          title="Click Trends (14 days)"
          data={overview.clickTrends}
          type="line"
          dataKey="clicks"
          color="#7c3aed"
          emptyMessage="No clicks in the last 14 days. Share a short link to see trends here."
        />
        <AnalyticsChart
          title="Traffic Sources"
          data={overview.trafficSources.map((s) => ({
            date: s.source,
            clicks: s.clicks,
          }))}
          type="bar"
          dataKey="clicks"
          color="#06b6d4"
          emptyMessage="No traffic yet. Sources appear once people click your links."
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Device Breakdown</h2>
          {overview.deviceBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clicks yet.</p>
          ) : (
            <div className="space-y-3">
              {overview.deviceBreakdown.map((device) => (
                <div key={device.device} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{device.device}</span>
                  <span className="text-muted-foreground">
                    {device.clicks} ({device.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Links</h2>
          {overview.recentLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No links yet.{' '}
              <Link href="/dashboard/links" className="text-primary hover:underline">
                Create your first link
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {overview.recentLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{link.title}</p>
                    <p className="text-xs text-accent truncate">{link.shortUrl}</p>
                  </div>
                  <div className="text-right text-muted-foreground shrink-0">
                    <p>{formatNumber(link.clickCount)} clicks</p>
                    <p className="text-xs">{formatRelativeTime(new Date(link.createdAt))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
