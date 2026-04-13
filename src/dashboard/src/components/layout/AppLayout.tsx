import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useUIStore } from '@/store/ui.store'

interface AppLayoutProps {
  children: ReactNode
}

/**
 * Layout raiz de todas as telas autenticadas.
 * Compõe Sidebar + Topbar + área de conteúdo.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Topbar />
      <main
        className="pt-14 min-h-screen transition-all"
        style={{
          marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          transition: 'margin-left 200ms cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
