import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  UserCog,
  Scissors,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { useUIStore } from '@/store/ui.store'
import { cn } from '@/lib/utils'

const navItems = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { to: ROUTES.APPOINTMENTS, icon: Calendar, label: 'Agendamentos' },
  { to: ROUTES.CLIENTS, icon: Users, label: 'Clientes' },
  { to: ROUTES.CONVERSATIONS, icon: MessageSquare, label: 'Conversas' },
  { to: ROUTES.PROFESSIONALS, icon: UserCog, label: 'Profissionais' },
  { to: ROUTES.SERVICES, icon: Scissors, label: 'Serviços' },
  { to: ROUTES.NOTIFICATIONS, icon: Bell, label: 'Notificações' },
  { to: ROUTES.SETTINGS, icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#1E3A5F] text-[#E2E8F0] transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!sidebarCollapsed && (
          <span className="text-lg font-semibold tracking-tight">Assistente IA</span>
        )}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          className="ml-auto rounded-md p-1 hover:bg-white/10"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#3B82F6] text-white'
                      : 'text-[#E2E8F0] hover:bg-white/10'
                  )
                }
              >
                <Icon size={18} className="shrink-0" />
                {!sidebarCollapsed && <span>{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
