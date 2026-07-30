'use client'

import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  color?: string
}

export function KPICard({
  title,
  value,
  change,
  icon,
  color = '#7c3aed',
}: KPICardProps) {
  const isPositive = change && change >= 0

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

      {change !== undefined && (
        <div className="flex items-center gap-1">
          {isPositive ? (
            <ArrowUp size={16} className="text-green-500" />
          ) : (
            <ArrowDown size={16} className="text-red-500" />
          )}
          <span className={isPositive ? 'text-green-500' : 'text-red-500'} style={{ fontSize: '12px' }}>
            {Math.abs(change)}% from last month
          </span>
        </div>
      )}
    </motion.div>
  )
}
