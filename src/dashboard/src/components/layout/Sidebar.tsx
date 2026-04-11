import { NavLink, useNavigate, useMatch } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  Scissors,
  Briefcase,
  Bell,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
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

const NAV_SECTIONS = [
  {
    id: 'main',
    label: 'Principal',
    items: [
      { label: 'Overview',      icon: LayoutDashboard, path: ROUTES.DASHBOARD },
      { label: 'Agendamentos',  icon: CalendarDays,    path: ROUTES.APPOINTMENTS },
      { label: 'Clientes',      icon: Users,           path: ROUTES.CLIENTS },
      { label: 'Conversas',     icon: MessageSquare,   path: ROUTES.CONVERSATIONS },
    ],
  },
  {
    id: 'business',
    label: 'Negócio',
    items: [
      { label: 'Profissionais', icon: Scissors,  path: ROUTES.PROFESSIONALS },
      { label: 'Serviços',      icon: Briefcase, path: ROUTES.SERVICES },
      { label: 'Notificações',  icon: Bell,      path: ROUTES.NOTIFICATIONS },
    ],
  },
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
        className="sidebar-transition flex flex-col h-screen fixed left-0 top-0 z-40"
        style={{
          width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          background: 'hsl(var(--sidebar-bg))',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Header: Logo + Toggle */}
        <div
          className="flex items-center h-16 flex-shrink-0"
          style={{
            padding: sidebarCollapsed ? '0 10px' : '0 12px 0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          }}
        >
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                  style={{ background: 'hsl(var(--sidebar-active-bg))' }}
                >
                  A
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight text-white truncate">
                    Assistente IA
                  </p>
                  <p className="text-[0.6875rem] leading-tight text-white/45 truncate">
                    Painel de Controle
                  </p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/75 hover:bg-white/8 transition-colors flex-shrink-0"
                aria-label="Recolher menu"
              >
                <PanelLeftClose size={17} />
              </button>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={toggleSidebar}
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white transition-opacity hover:opacity-80"
                    style={{ background: 'hsl(var(--sidebar-active-bg))' }}
                    aria-label="Expandir menu"
                  >
                    <PanelLeftOpen size={17} className="text-white" />
                  </button>
                }
              />
              <TooltipContent side="right">Expandir menu</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navegação principal */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_SECTIONS.map((section, i) => (
            <div key={section.id} className={cn(i > 0 && 'mt-4')}>
              {!sidebarCollapsed ? (
                <p className="px-3 mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-widest text-white/35 select-none">
                  {section.label}
                </p>
              ) : (
                i > 0 && <div className="h-px mx-1 mb-3 bg-white/10" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Navegação inferior */}
        <div
          className="py-2 px-2 space-y-0.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {BOTTOM_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
          ))}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => void handleLogout()}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 text-white/50 hover:bg-white/7 hover:text-white/80',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                >
                  <LogOut size={20} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span className="text-sm">Sair</span>}
                </button>
              }
            />
            {sidebarCollapsed && <TooltipContent side="right">Sair</TooltipContent>}
          </Tooltip>
        </div>
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
  const isActive = !!useMatch({ path, end: true })

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <NavLink
            to={path}
            className={cn(
              'relative flex items-center gap-3 py-2.5 rounded-lg transition-colors duration-150',
              collapsed ? 'justify-center px-2' : 'px-3',
              isActive
                ? 'bg-white/12 text-white font-medium'
                : 'text-white/60 hover:bg-white/7 hover:text-white/85'
            )}
          >
            {isActive && !collapsed && (
              <span
                className="absolute left-0 inset-y-2 w-[3px] rounded-r-full"
                style={{ background: 'hsl(var(--sidebar-active-bg))' }}
              />
            )}
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm">{label}</span>}
          </NavLink>
        }
      />
      {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  )
}
