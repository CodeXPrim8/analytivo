'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import {
  Menu,
  X,
  BarChart3,
  Link as LinkIcon,
  Zap,
  QrCode,
  Sparkles,
  FileText,
  Users,
  Settings,
  CreditCard,
  HelpCircle,
  Bell,
  LogOut,
} from 'lucide-react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'

const sidebarItems = [
  { label: 'Overview', href: '/dashboard', icon: BarChart3 },
  { label: 'Links', href: '/dashboard/links', icon: LinkIcon },
  { label: 'Campaigns', href: '/dashboard/campaigns', icon: Zap },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'QR Codes', href: '/dashboard/qr-codes', icon: QrCode },
  { label: 'AI Insights', href: '/dashboard/ai-insights', icon: Sparkles },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText },
]

const bottomItems = [
  { label: 'Team', href: '/dashboard/team', icon: Users },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Help', href: '/resources', icon: HelpCircle },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
  }

  const avatar =
    user?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`

  return (
    <div className="flex h-screen bg-background">
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed lg:relative top-0 left-0 z-40 h-screen border-r border-border bg-card/50 backdrop-blur-sm flex flex-col ${
          sidebarOpen ? 'w-72' : 'w-0'
        } lg:w-72 transition-all duration-300 overflow-hidden`}
      >
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3 font-bold hover:opacity-80">
            <BrandLogo size={48} />
            <span>Analytivo</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-4 space-y-2">
          {bottomItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="border-t border-border p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img src={avatar} alt={user?.name || 'User'} className="w-8 h-8 rounded-full" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {isLoading ? 'Loading...' : user?.name || 'Account'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <LogOut size={16} className="text-muted-foreground flex-shrink-0" />
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex-1 hidden md:block">
            <h1 className="text-lg font-semibold">
              {user?.workspaceName || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
              <Bell size={20} />
            </button>
            <img src={avatar} alt="" className="w-8 h-8 rounded-full" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>

      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
        />
      )}
    </div>
  )
}
