'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/lib/actions'
import { formatRelativeTime } from '@/lib/utils-helpers'

type NotificationItem = {
  id: string
  title: string
  body: string
  type: string
  href: string | null
  read: boolean
  createdAt: Date | string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [pending, startTransition] = useTransition()
  const panelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    startTransition(async () => {
      const result = await getNotificationsAction()
      setItems(result.notifications)
      setUnreadCount(result.unreadCount)
    })
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const markOne = (id: string) => {
    startTransition(async () => {
      await markNotificationReadAction(id)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    })
  }

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction()
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    })
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) load()
        }}
        className="p-2 hover:bg-muted rounded-lg transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-semibold text-sm">Notifications</p>
            <button
              type="button"
              onClick={markAll}
              disabled={pending || unreadCount === 0}
              className="text-xs text-primary hover:underline disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No notifications yet. Refresh AI Insights to get alerts.
              </p>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href || '/dashboard/ai-insights'}
                  onClick={() => {
                    if (!item.read) markOne(item.id)
                    setOpen(false)
                  }}
                  className={`block px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors ${
                    item.read ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!item.read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                    <div className={item.read ? 'pl-4' : ''}>
                      <p className="text-sm font-medium leading-snug">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.body}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatRelativeTime(new Date(item.createdAt))}
                        {item.type === 'insight' ? ' · AI Insight' : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
