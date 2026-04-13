import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  title: ReactNode
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
      <div className="flex items-center justify-between pb-5 border-b">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
      </div>
      {children}
    </div>
  )
}
