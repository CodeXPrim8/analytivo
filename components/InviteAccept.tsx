'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { acceptInviteAction } from '@/lib/actions'

export function InviteAccept({
  token,
  workspaceName,
}: {
  token: string
  workspaceName: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const accept = () => {
    setError('')
    startTransition(async () => {
      const result = await acceptInviteAction(token)
      if (result.error) {
        setError(result.error)
        return
      }
      // Full navigation so the workspace cookie is applied on the first render.
      window.location.assign('/dashboard')
    })
  }

  return (
    <div className="space-y-4">
      {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}
      <Button onClick={accept} disabled={pending} className="w-full font-semibold">
        {pending ? 'Joining…' : `Join ${workspaceName}`}
      </Button>
    </div>
  )
}
