'use client'

import { useState, useTransition } from 'react'
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
  LogOut,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { AutoRefresh } from '@/components/AutoRefresh'
import { NotificationBell } from '@/components/NotificationBell'
import { switchWorkspaceAction } from '@/lib/actions'
import type { WorkspaceRole, WorkspaceSummary } from '@/lib/workspace'

const sidebarItems = [
  { label: 'Overview', href: '/dashboard', icon: BarChart3 },
  { label: 'Links', href: '/dashboard/links', icon: LinkIcon },
  { label: 'Campaigns', href: '/dashboard/campaigns', icon: Zap },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'QR Codes', href: '/dashboard/qr-codes', icon: QrCode },
  { label: 'AI Insights', href: '/dashboard/ai-insights', icon: Sparkles },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText },
]

const ROLE_STYLES: Record<WorkspaceRole, string> = {
  owner: 'bg-primary/15 text-primary',
  admin: 'bg-accent/15 text-accent',
  editor: 'bg-emerald-500/15 text-emerald-400',
  viewer: 'bg-muted text-muted-foreground',
}

export function RoleBadge({ role, className = '' }: { role: WorkspaceRole; className?: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${ROLE_STYLES[role]} ${className}`}
    >
      {role}
    </span>
  )
}

type Props = {
  children: React.ReactNode
  workspaces: WorkspaceSummary[]
  activeOwnerId: string
  workspaceName: string
  role: WorkspaceRole
}

export function DashboardShell({
  children,
  workspaces,
  activeOwnerId,
  workspaceName,
  role,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  const bottomItems = [
    { label: 'Team', href: '/dashboard/team', icon: Users },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ...(role === 'owner'
      ? [{ label: 'Billing', href: '/dashboard/billing', icon: CreditCard }]
      : []),
    { label: 'Help', href: '/resources', icon: HelpCircle },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
  }

  const switchTo = (ownerId: string) => {
    setSwitcherOpen(false)
    if (ownerId === activeOwnerId) return
    startTransition(async () => {
      const result = await switchWorkspaceAction(ownerId)
      if (result.error) return
      // Full navigation: the client router caches the layout, so a soft refresh
      // would keep rendering the previous workspace.
      window.location.assign('/dashboard')
    })
  }

  const avatar =
    user?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`

  return (
    <div className="flex h-screen bg-background">
      <AutoRefresh intervalMs={10000} />
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

        {workspaces.length > 1 && (
          <div className="px-4 pt-4 relative">
            <button
              onClick={() => setSwitcherOpen((open) => !open)}
              disabled={pending}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left disabled:opacity-60"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{workspaceName}</p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
              <ChevronsUpDown size={16} className="text-muted-foreground shrink-0" />
            </button>

            {switcherOpen && (
              <div className="absolute left-4 right-4 mt-2 z-50 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.ownerId}
                    onClick={() => switchTo(workspace.ownerId)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{workspace.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {workspace.role === 'owner' ? 'You own this' : workspace.ownerEmail}
                      </p>
                    </div>
                    {workspace.ownerId === activeOwnerId && (
                      <Check size={16} className="text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80"
              onClick={() => setSidebarOpen(false)}
            >
              <img src={avatar} alt={user?.name || 'User'} className="w-8 h-8 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {isLoading ? 'Loading...' : user?.name || 'Account'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Log out"
            >
              <LogOut size={16} className="text-muted-foreground" />
            </button>
          </div>
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

          <div className="flex-1 hidden md:flex items-center gap-3">
            <h1 className="text-lg font-semibold">{workspaceName}</h1>
            {!(role === 'owner' && workspaces.length <= 1) && <RoleBadge role={role} />}
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link href="/dashboard/settings" className="hover:opacity-80">
              <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            </Link>
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
