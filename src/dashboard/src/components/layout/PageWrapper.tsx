import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  title: string
  description?: string
  /** Ação no canto superior direito (ex: botão "Novo agendamento") */
  action?: ReactNode
  /** @deprecated use action */
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Wrapper padrão para todas as páginas autenticadas.
 * Garante espaçamento, título e estrutura consistentes entre telas.
 */
export function PageWrapper({ title, description, action, actions, children, className }: PageWrapperProps) {
  const rightSlot = action ?? actions
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
      </div>
      {children}
    </div>
  )
}
