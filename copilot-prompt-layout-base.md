# Prompt: Layout Base do Dashboard

> Cole esse prompt no GitHub Copilot Chat (modo Agent).
> O ambiente já está configurado (Vite + React + TypeScript + shadcn/ui + TanStack Query + Zustand + Supabase).

---

## CONTEXTO

Vamos criar o layout base do dashboard — o shell que envolve todas as telas autenticadas. Ele é composto por:

- **Sidebar** fixa à esquerda com navegação
- **Topbar** no topo com nome do negócio e menu do usuário
- **PageWrapper** que envolve o conteúdo de cada tela

O layout precisa ser **moderno, limpo e prático** — sem cara de template genérico. Tema azul claro como cor primária, fácil de trocar por cliente via `theme/index.ts`.

---

## ARQUIVOS JÁ EXISTENTES — NÃO RECRIAR

Os seguintes arquivos já existem e devem ser **importados**, não recriados:

- `src/lib/constants.ts` — contém `ROUTES` com todos os paths
- `src/store/ui.store.ts` — contém `useUIStore` com `sidebarCollapsed` e `toggleSidebar`
- `src/store/auth.store.ts` — contém `useAuthStore` com `user` e `businessId`
- `src/theme/index.ts` — contém as cores do tema (`theme.primary`, `theme.sidebar`)
- `src/lib/supabase.ts` — cliente Supabase

---

## PASSO 1 — INSTALAR COMPONENTES shadcn/ui NECESSÁRIOS

```bash
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add separator
npx shadcn@latest add tooltip
npx shadcn@latest add sheet
```

---

## PASSO 2 — ATUALIZAR `src/index.css`

Substitua o conteúdo por:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Tema primário — alterar aqui para trocar o tema do cliente */
    --primary: 217 91% 60%;           /* blue-500 */
    --primary-foreground: 0 0% 100%;

    /* Sidebar */
    --sidebar-bg: 220 47% 25%;        /* azul escuro */
    --sidebar-text: 214 32% 91%;      /* cinza azulado claro */
    --sidebar-active-bg: 217 91% 60%; /* primary */
    --sidebar-active-text: 0 0% 100%;
    --sidebar-hover-bg: 220 47% 30%;
    --sidebar-width: 240px;
    --sidebar-collapsed-width: 64px;

    /* Base shadcn */
    --background: 0 0% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 217 91% 60%;
    --radius: 0.5rem;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Transição suave da sidebar */
.sidebar-transition {
  transition: width 200ms ease;
}
```

---

## PASSO 3 — CRIAR `src/components/layout/Sidebar.tsx`

```tsx
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

// Itens de navegação — adicionar/remover features aqui
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
    navigate(ROUTES.LOGIN)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'sidebar-transition flex flex-col h-screen fixed left-0 top-0 z-40',
          'border-r border-white/10'
        )}
        style={{
          width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          background: 'hsl(var(--sidebar-bg))',
        }}
      >
        {/* Logo / Nome do sistema */}
        <div className="flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0">
          {!sidebarCollapsed && (
            <span className="font-semibold text-base tracking-tight" style={{ color: 'hsl(var(--sidebar-text))' }}>
              Assistente IA
            </span>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ background: 'hsl(var(--sidebar-active-bg))' }}>
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

          {/* Botão de logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                  'transition-colors duration-150',
                  'hover:bg-white/10'
                )}
                style={{ color: 'hsl(var(--sidebar-text))' }}
              >
                <LogOut size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && <span>Sair</span>}
              </button>
            </TooltipTrigger>
            {sidebarCollapsed && <TooltipContent side="right">Sair</TooltipContent>}
          </Tooltip>
        </div>

        {/* Botão collapse */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'absolute -right-3 top-20 z-50',
            'w-6 h-6 rounded-full border flex items-center justify-center',
            'bg-white shadow-sm hover:shadow-md transition-shadow',
            'border-border'
          )}
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

// Componente de item de navegação
interface NavItemProps {
  item: { label: string; icon: React.ElementType; path: string }
  collapsed: boolean
}

function NavItem({ item, collapsed }: NavItemProps) {
  const { icon: Icon, label, path } = item

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={path}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150',
              isActive
                ? 'font-medium'
                : 'hover:bg-white/10',
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
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  )
}
```

---

## PASSO 4 — CRIAR `src/components/layout/Topbar.tsx`

```tsx
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { LogOut, Settings } from 'lucide-react'

// Retorna as iniciais do email para o avatar (ex: "ka" → "KA")
function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

export function Topbar() {
  const { user } = useAuthStore()
  const { clear } = useAuthStore()
  const { sidebarCollapsed } = useUIStore()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    clear()
    navigate(ROUTES.LOGIN)
  }

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-6 border-b bg-white"
      style={{
        left: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        transition: 'left 200ms ease',
      }}
    >
      {/* Lado esquerdo — título da página (preenchido via Outlet context ou por cada página) */}
      <div id="topbar-title" />

      {/* Lado direito — usuário */}
      <div className="flex items-center gap-3 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
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
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
              <Settings size={14} className="mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut size={14} className="mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

---

## PASSO 5 — CRIAR `src/components/layout/PageWrapper.tsx`

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  // Título exibido no topo da página
  title: string
  // Subtítulo opcional
  description?: string
  // Ação no canto superior direito (ex: botão "Novo agendamento")
  action?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Wrapper padrão para todas as páginas autenticadas.
 * Garante espaçamento, título e estrutura consistentes entre telas.
 */
export function PageWrapper({ title, description, action, children, className }: PageWrapperProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Cabeçalho da página */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Conteúdo da página */}
      {children}
    </div>
  )
}
```

---

## PASSO 6 — CRIAR `src/components/layout/AppLayout.tsx`

```tsx
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

      {/* Área de conteúdo — responde ao estado da sidebar */}
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
```

---

## PASSO 7 — CRIAR `src/components/layout/index.ts`

```ts
export { AppLayout } from './AppLayout'
export { Sidebar } from './Sidebar'
export { Topbar } from './Topbar'
export { PageWrapper } from './PageWrapper'
```

---

## PASSO 8 — CRIAR A TELA DE LOGIN

Crie `src/features/auth/pages/LoginPage.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setAuthError('Email ou senha incorretos.')
      return
    }
    navigate(ROUTES.DASHBOARD)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: 'hsl(var(--primary))' }}>
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h1 className="text-xl font-semibold">Assistente IA</h1>
          <p className="text-sm text-muted-foreground mt-1">Acesse o painel do seu negócio</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {authError && (
            <div className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {authError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

---

## PASSO 9 — CRIAR STUBS DAS PÁGINAS

Para cada feature abaixo, crie um arquivo de página stub. O Copilot vai substituir cada um nas próximas iterações.

Crie `src/features/dashboard/pages/DashboardPage.tsx`:
```tsx
import { PageWrapper } from '@/components/layout'
export default function DashboardPage() {
  return <PageWrapper title="Overview" description="Resumo do dia"><div /></PageWrapper>
}
```

Repita o mesmo padrão para:
- `src/features/appointments/pages/AppointmentsPage.tsx` → title: "Agendamentos"
- `src/features/clients/pages/ClientsPage.tsx` → title: "Clientes"
- `src/features/conversations/pages/ConversationsPage.tsx` → title: "Conversas"
- `src/features/professionals/pages/ProfessionalsPage.tsx` → title: "Profissionais"
- `src/features/services/pages/ServicesPage.tsx` → title: "Serviços"
- `src/features/notifications/pages/NotificationsPage.tsx` → title: "Notificações"
- `src/features/settings/pages/SettingsPage.tsx` → title: "Configurações"

---

## PASSO 10 — ATUALIZAR `src/App.tsx`

Adicione as novas rotas que ainda não existem:

```tsx
const ProfessionalsPage = lazy(() => import('@/features/professionals/pages/ProfessionalsPage'))
const ServicesPage = lazy(() => import('@/features/services/pages/ServicesPage'))
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'))
```

E adicione dentro de `<Routes>`:
```tsx
<Route path={ROUTES.PROFESSIONALS} element={<ProfessionalsPage />} />
<Route path={ROUTES.SERVICES} element={<ServicesPage />} />
<Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
```

---

## PASSO 11 — ATUALIZAR `src/lib/constants.ts`

Confirme que `ROUTES` tem todas as rotas necessárias:

```ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  APPOINTMENTS: '/appointments',
  CLIENTS: '/clients',
  CONVERSATIONS: '/conversations',
  PROFESSIONALS: '/professionals',
  SERVICES: '/services',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
} as const
```

---

## VERIFICAÇÃO FINAL

Após executar todos os passos, confirme:

- [ ] `npm run dev` abre sem erros
- [ ] `/login` renderiza o formulário de login
- [ ] Login com `kaiodavineves@gmail.com` redireciona para `/dashboard`
- [ ] Sidebar aparece com todos os itens de navegação
- [ ] Sidebar colapsa e expande clicando no botão lateral
- [ ] Navegar entre rotas funciona sem erro
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem warnings
