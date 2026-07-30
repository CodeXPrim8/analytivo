import Image from 'next/image'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  size?: number
  priority?: boolean
}

export function BrandLogo({ className, size = 48, priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/logo-mark.png"
      alt="Analytivo"
      width={size}
      height={size}
      priority={priority}
      className={cn('object-contain shrink-0', className)}
    />
  )
}
