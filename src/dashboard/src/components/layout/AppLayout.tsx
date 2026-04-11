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
        className="pt-16 min-h-screen transition-all duration-200"
        style={{
          marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
