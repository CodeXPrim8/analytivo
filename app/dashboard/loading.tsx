export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-10 w-56 rounded bg-muted mb-2" />
        <div className="h-4 w-72 rounded bg-muted" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border bg-card/50" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-xl border border-border bg-card/50" />
        <div className="h-80 rounded-xl border border-border bg-card/50" />
      </div>
    </div>
  )
}
