'use client'

import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number | null
  changeLabel?: string
  icon?: React.ReactNode
  color?: string
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs prior period',
  icon,
  color = '#7c3aed',
}: KPICardProps) {
  const hasChange = change !== undefined && change !== null
  const isFlat = hasChange && change === 0
  const isPositive = hasChange && change > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm hover:bg-card/80 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold">{value}</p>
      </div>

      {hasChange ? (
        <div className="flex items-center gap-1">
          {isFlat ? (
            <Minus size={16} className="text-muted-foreground" />
          ) : isPositive ? (
            <ArrowUp size={16} className="text-green-500" />
          ) : (
            <ArrowDown size={16} className="text-red-500" />
          )}
          <span
            className={
              isFlat ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'
            }
            style={{ fontSize: '12px' }}
          >
            {isFlat ? '0%' : `${Math.abs(change)}%`} {changeLabel}
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No prior period to compare</p>
      )}
    </motion.div>
  )
}
