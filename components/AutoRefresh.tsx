'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Re-fetches server component data on an interval (and when the tab regains
 * focus) so dashboard stats stay live without a full page reload.
 */
export function AutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }

    const id = setInterval(refresh, intervalMs)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      clearInterval(id)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [router, intervalMs])

  return null
}
