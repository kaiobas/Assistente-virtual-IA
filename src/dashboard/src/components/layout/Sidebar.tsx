import { NavLink, useNavigate, useMatch } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  UserCog,
  Briefcase,
  Bell,
  Settings,
  LogOut,
  PanelLeftClose,
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
import mascoteSrc from '@/assets/mascote.png'
import tituloSrc from '@/assets/titulo.png'

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
      { label: 'Profissionais', icon: UserCog,  path: ROUTES.PROFESSIONALS },
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
        className="sidebar-transition flex flex-col h-screen fixed left-0 top-0 z-40 border-r"
        style={{
          width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          background: 'hsl(var(--sidebar-bg))',
          borderColor: 'hsl(var(--sidebar-border))',
        }}
      >
        {/* Header: Logo + Toggle */}
        <div
          className="flex items-center h-16 flex-shrink-0 border-b"
          style={{
            borderColor: 'hsl(var(--sidebar-border))',
            padding: sidebarCollapsed ? '0 12px' : '0 14px 0 18px',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          }}
        >
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <img src={mascoteSrc} alt="Atendi" className="h-9 w-9 flex-shrink-0" />
                <img src={tituloSrc} alt="ATENDI" className="h-6 flex-shrink-0 logo-theme" />
              </div>
              <button
                onClick={toggleSidebar}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                aria-label="Recolher menu"
              >
                <PanelLeftClose size={16} />
              </button>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center transition-opacity hover:opacity-75"
                    aria-label="Expandir menu"
                  >
                    <img src={mascoteSrc} alt="Atendi" className="h-9 w-9" />
                  </button>
                }
              />
              <TooltipContent side="right">Expandir menu</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navegação principal */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id}>
              {!sidebarCollapsed ? (
                <p
                  className="px-2 mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-widest select-none"
                  style={{ color: 'hsl(var(--sidebar-section-label))' }}
                >
                  {section.label}
                </p>
              ) : (
                <div className="h-px mx-1 mb-3" style={{ background: 'hsl(var(--sidebar-border))' }} />
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
        <div className="py-3 px-3 space-y-0.5 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
          {BOTTOM_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
          ))}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => void handleLogout()}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-lg transition-colors duration-150',
                    'text-muted-foreground hover:text-foreground',
                    sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                  )}
                  style={{ ['--hover-bg' as string]: 'hsl(var(--sidebar-hover-bg))' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--sidebar-hover-bg))' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                >
                  <LogOut size={18} className="flex-shrink-0" />
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
              'relative flex items-center gap-2.5 rounded-lg transition-all duration-150',
              collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
            )}
            style={isActive
              ? {
                  background: 'hsl(var(--sidebar-active-bg))',
                  color: 'hsl(var(--sidebar-active-text))',
                  fontWeight: '500',
                  boxShadow: '0 1px 3px hsl(var(--sidebar-active-bg) / 40%)',
                }
              : { color: 'hsl(var(--sidebar-text))' }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = 'hsl(var(--sidebar-hover-bg))'
                ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--sidebar-hover-text))'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = ''
                ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--sidebar-text))'
              }
            }}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm">{label}</span>}
          </NavLink>
        }
      />
      {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  )
}

