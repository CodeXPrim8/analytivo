'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-primary/10 via-accent/5 to-background border-r border-border"
      >
        <Link href="/" className="flex items-center gap-3 font-bold text-xl hover:opacity-80 transition-opacity">
          <BrandLogo size={56} priority />
          <span>Analytivo</span>
        </Link>

        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-bold mb-6 text-balance"
          >
            Track Every Click, Understand Every Viewer
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg text-muted-foreground text-balance"
          >
            Join creators and businesses optimizing their video marketing with real-time analytics and AI insights.
          </motion.p>
        </div>

        <div className="text-sm text-muted-foreground">© 2026 Analytivo. All rights reserved.</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center justify-center px-4 py-8"
      >
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="flex lg:hidden items-center gap-3 font-bold text-lg mb-8 hover:opacity-80 transition-opacity"
          >
            <BrandLogo size={48} />
            <span>Analytivo</span>
          </Link>

          {children}
        </div>
      </motion.div>
    </div>
  )
}
