import Link from 'next/link'
import { Lock } from 'lucide-react'

type Props = {
  title: string
  description: string
  /** Only the owner can change the plan, so only they get the billing link. */
  isOwner: boolean
  className?: string
}

export function UpgradeNotice({ title, description, isOwner, className = '' }: Props) {
  return (
    <div
      className={`rounded-xl border border-accent/30 bg-accent/5 p-5 flex items-start gap-3 ${className}`}
    >
      <Lock size={18} className="mt-0.5 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        {isOwner && (
          <Link
            href="/dashboard/billing"
            className="inline-block mt-3 text-sm font-medium text-accent hover:underline"
          >
            View plans
          </Link>
        )}
      </div>
    </div>
  )
}
