import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { LogOut, Settings } from 'lucide-react'

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

export function Topbar() {
  const { user, clear } = useAuthStore()
  const { sidebarCollapsed } = useUIStore()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    clear()
    void navigate(ROUTES.LOGIN)
  }

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-6 border-b bg-white"
      style={{
        left: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        transition: 'left 200ms ease',
      }}
    >
      <div id="topbar-title" />

      <div className="flex items-center gap-3 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted transition-colors outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {user?.email ? getInitials(user.email) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user?.email}
                </span>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => void navigate(ROUTES.SETTINGS)}>
                <Settings size={14} className="mr-2" />
                Configurações
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => void handleLogout()} className="text-destructive focus:text-destructive">
                <LogOut size={14} className="mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
