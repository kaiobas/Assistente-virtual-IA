import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function PageWrapper({ title, description, actions, children, className }: PageWrapperProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
