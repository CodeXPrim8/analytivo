'use client'

import { motion } from 'framer-motion'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AnalyticsChartProps {
  title: string
  data: any[]
  type?: 'line' | 'bar'
  dataKey: string
  color?: string
  emptyMessage?: string
}

export function AnalyticsChart({
  title,
  data,
  type = 'line',
  dataKey,
  color = '#7c3aed',
  emptyMessage = 'No data yet. Share a link to start collecting clicks.',
}: AnalyticsChartProps) {
  const hasData = data.length > 0 && data.some((d) => (d?.[dataKey] ?? 0) > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border bg-card/50 p-6"
    >
      <h3 className="text-lg font-semibold mb-6">{title}</h3>
      {!hasData ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-muted-foreground text-center px-6">{emptyMessage}</p>
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={300}>
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10,14,39,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10,14,39,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey={dataKey} fill={color} isAnimationActive={true} />
          </BarChart>
        )}
      </ResponsiveContainer>
      )}
    </motion.div>
  )
}
