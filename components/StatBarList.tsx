import { formatNumber } from '@/lib/utils-helpers'

interface StatBarItem {
  label: string
  value: number
  percentage: number
}

interface StatBarListProps {
  title: string
  items: StatBarItem[]
  emptyMessage: string
}

export function StatBarList({ title, items, emptyMessage }: StatBarListProps) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-6">
      <h2 className="text-lg font-semibold mb-6">{title}</h2>
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-muted-foreground text-center px-4">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="font-medium capitalize">{item.label}</span>
                <span className="text-muted-foreground">{formatNumber(item.value)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(item.percentage, 2)}%`,
                    background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
