import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  Scissors,
  Briefcase,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { supabase } from '@/lib/supabase'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const NAV_ITEMS = [
  { label: 'Overview',       icon: LayoutDashboard, path: ROUTES.DASHBOARD },
  { label: 'Agendamentos',   icon: CalendarDays,    path: ROUTES.APPOINTMENTS },
  { label: 'Clientes',       icon: Users,           path: ROUTES.CLIENTS },
  { label: 'Conversas',      icon: MessageSquare,   path: ROUTES.CONVERSATIONS },
  { label: 'Profissionais',  icon: Scissors,        path: ROUTES.PROFESSIONALS },
  { label: 'Serviços',       icon: Briefcase,       path: ROUTES.SERVICES },
  { label: 'Notificações',   icon: Bell,            path: ROUTES.NOTIFICATIONS },
] as const

const BOTTOM_ITEMS = [
  { label: 'Configurações', icon: Settings, path: ROUTES.SETTINGS },
] as const

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { clear } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    clear()
    void navigate(ROUTES.LOGIN)
  }

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn('sidebar-transition flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-white/10')}
        style={{
          width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          background: 'hsl(var(--sidebar-bg))',
        }}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0">
          {!sidebarCollapsed && (
            <span className="font-semibold text-base tracking-tight" style={{ color: 'hsl(var(--sidebar-text))' }}>
              Assistente IA
            </span>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'hsl(var(--sidebar-active-bg))' }}>
              <span className="text-white font-bold text-sm">A</span>
            </div>
          )}
        </div>

        {/* Navegação principal */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        {/* Navegação inferior */}
        <div className="py-3 px-2 space-y-0.5 border-t border-white/10">
          {BOTTOM_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
          ))}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => void handleLogout()}
                  className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 hover:bg-white/10', sidebarCollapsed && 'justify-center px-2')}
                  style={{ color: 'hsl(var(--sidebar-text))' }}
                >
                  <LogOut size={18} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span>Sair</span>}
                </button>
              }
            />
            {sidebarCollapsed && <TooltipContent side="right">Sair</TooltipContent>}
          </Tooltip>
        </div>

        {/* Botão collapse */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 z-50 w-6 h-6 rounded-full border flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-shadow border-border"
          aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {sidebarCollapsed
            ? <ChevronRight size={12} className="text-muted-foreground" />
            : <ChevronLeft size={12} className="text-muted-foreground" />
          }
        </button>
      </aside>
    </TooltipProvider>
  )
}

interface NavItemProps {
  item: { label: string; icon: React.ElementType; path: string }
  collapsed: boolean
}

function NavItem({ item, collapsed }: NavItemProps) {
  const { icon: Icon, label, path } = item
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <NavLink
            to={path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150',
                isActive ? 'font-medium' : 'hover:bg-white/10',
                collapsed && 'justify-center px-2'
              )
            }
            style={({ isActive }) => ({
              color: isActive ? 'hsl(var(--sidebar-active-text))' : 'hsl(var(--sidebar-text))',
              background: isActive ? 'hsl(var(--sidebar-active-bg))' : undefined,
            })}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        }
      />
      {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  )
}
