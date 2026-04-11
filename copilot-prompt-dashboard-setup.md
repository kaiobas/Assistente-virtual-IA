# Prompt: Configuração do Ambiente — Dashboard Assistente Virtual IA

> Cole esse prompt diretamente no GitHub Copilot Chat (modo Agent).
> Ele vai configurar todo o ambiente do zero, de forma padronizada e reutilizável.

---

## CONTEXTO DO PROJETO

Você vai configurar o ambiente de desenvolvimento completo de um **dashboard web** para um sistema de atendimento via WhatsApp com IA. O dashboard é o painel de controle para o dono do negócio visualizar conversas, gerenciar agendamentos, clientes e configurações.

**Importante:** esse projeto será usado como **template base reutilizável** para múltiplos clientes (barbearias, clínicas, salões etc.), então a arquitetura precisa ser genérica, extensível e com tema facilmente configurável por cliente.

O backend é **Supabase** (PostgreSQL + Auth + Realtime + Storage). Os dados são consumidos via **PostgREST** (SDK do Supabase) e futuramente via **Edge Functions** para lógica complexa.

---

## STACK DEFINIDA

| Camada | Tecnologia |
|---|---|
| Framework | Vite + React 18 |
| Linguagem | TypeScript (strict mode) |
| Roteamento | React Router v6 |
| UI Components | shadcn/ui (Tailwind CSS + Radix UI) |
| Server State | TanStack Query v5 (React Query) |
| Client State | Zustand |
| Auth + Backend | Supabase JS v2 |
| Forms | React Hook Form + Zod |
| Linting | ESLint + Prettier |
| Git Hooks | Husky + lint-staged |
| Testes | Vitest + Testing Library |
| Ícones | Lucide React |
| Datas | date-fns |

---

## PASSO 1 — INICIALIZAR O PROJETO

```bash
# Na raiz do repositório, dentro da pasta src/dashboard/
cd src/dashboard

npm create vite@latest . -- --template react-ts
npm install
```

---

## PASSO 2 — INSTALAR DEPENDÊNCIAS

```bash
# Roteamento
npm install react-router-dom

# UI Base
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot
npm install lucide-react

# shadcn/ui CLI
npx shadcn@latest init

# Server state
npm install @tanstack/react-query @tanstack/react-query-devtools

# Client state
npm install zustand

# Supabase
npm install @supabase/supabase-js

# Forms e validação
npm install react-hook-form zod @hookform/resolvers

# Datas
npm install date-fns

# Testes
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Lint e formatação
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier

# Git hooks
npm install -D husky lint-staged
npx husky init
```

---

## PASSO 3 — ESTRUTURA DE PASTAS

Crie exatamente essa estrutura dentro de `src/`:

```
src/
├── assets/                  # Imagens, fontes, SVGs estáticos
│
├── components/              # Componentes reutilizáveis globais
│   ├── ui/                  # Componentes base do shadcn/ui (auto-gerados)
│   ├── layout/              # Shell do app (sidebar, topbar, page wrapper)
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── PageWrapper.tsx
│   └── shared/              # Componentes compartilhados entre features
│       ├── DataTable/
│       ├── EmptyState/
│       ├── ErrorBoundary/
│       ├── LoadingSpinner/
│       ├── StatusBadge/
│       └── ConfirmDialog/
│
├── features/                # Módulos por domínio de negócio
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── index.ts         # Barrel export de cada feature
│   ├── dashboard/           # Página inicial / overview
│   ├── appointments/
│   ├── clients/
│   ├── conversations/
│   ├── professionals/
│   ├── services/
│   ├── notifications/
│   └── settings/
│
├── hooks/                   # Hooks globais reutilizáveis
│   ├── useAuth.ts
│   ├── useMediaQuery.ts
│   └── useDebounce.ts
│
├── lib/                     # Configurações de libs externas e utilitários
│   ├── supabase.ts          # Cliente Supabase
│   ├── queryClient.ts       # Configuração TanStack Query
│   ├── utils.ts             # cn() e helpers gerais
│   └── constants.ts         # Constantes globais (rotas, enums, etc.)
│
├── services/                # Funções de acesso a dados (PostgREST + Edge Functions)
│   ├── appointments.service.ts
│   ├── clients.service.ts
│   ├── conversations.service.ts
│   ├── professionals.service.ts
│   ├── services.service.ts
│   └── business.service.ts
│
├── store/                   # Zustand stores
│   ├── auth.store.ts
│   └── ui.store.ts
│
├── theme/                   # Configuração do tema (cores por cliente)
│   └── index.ts
│
├── types/                   # Tipos TypeScript globais e tipos do Supabase
│   ├── database.types.ts    # Tipos gerados pelo Supabase CLI
│   ├── api.types.ts         # Tipos de request/response das services
│   └── index.ts             # Re-exports
│
├── App.tsx                  # Roteamento raiz
├── main.tsx                 # Entry point
└── vite-env.d.ts
```

**Regras de arquitetura a seguir:**

- Cada `feature/` é autossuficiente: tem seus próprios `components/`, `hooks/`, `pages/` e `index.ts`
- Componentes dentro de `features/` **não** importam de outras features diretamente — comunicação via store ou props
- `components/shared/` é para componentes sem dependência de domínio
- `services/` nunca importa de `components/` ou `features/` — só de `lib/` e `types/`
- Cada pasta de componente tem: `ComponentName.tsx`, `ComponentName.test.tsx` e `index.ts`

---

## PASSO 4 — CONFIGURAÇÕES

### `tsconfig.json` — TypeScript strict

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `vite.config.ts` — Path aliases

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

### `.eslintrc.json`

```json
{
  "root": true,
  "env": { "browser": true, "es2020": true },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react/jsx-runtime",
    "prettier"
  ],
  "ignorePatterns": ["dist", ".eslintrc.json"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": ["./tsconfig.json", "./tsconfig.node.json"],
    "tsconfigRootDir": "__dirname"
  },
  "plugins": ["react-refresh"],
  "rules": {
    "react-refresh/only-export-components": ["warn", { "allowConstantExport": true }],
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/consistent-type-imports": "error",
    "react/prop-types": "off"
  }
}
```

### `.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### `package.json` — Scripts e lint-staged

Adicione/substitua em `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,json,md}": ["prettier --write"]
  }
}
```

### `.husky/pre-commit`

```bash
npx lint-staged
```

---

## PASSO 5 — ARQUIVOS BASE PARA CRIAR

### `src/lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
```

### `src/lib/queryClient.ts`

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutos
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

### `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utilitário padrão do shadcn/ui para merge de classes Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### `src/lib/constants.ts`

```ts
// Rotas da aplicação — fonte única de verdade para os paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  APPOINTMENTS: '/appointments',
  CLIENTS: '/clients',
  CONVERSATIONS: '/conversations',
  PROFESSIONALS: '/professionals',
  SERVICES: '/services',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
} as const

// Chaves de query para TanStack Query — evitar strings duplicadas
export const QUERY_KEYS = {
  APPOINTMENTS: 'appointments',
  CLIENTS: 'clients',
  CONVERSATIONS: 'conversations',
  PROFESSIONALS: 'professionals',
  SERVICES: 'services',
  BUSINESS: 'business',
  NOTIFICATIONS: 'notifications',
} as const
```

### `src/theme/index.ts`

```ts
/**
 * Configuração de tema por cliente.
 * Para trocar as cores do sistema, altere apenas os valores aqui.
 * O tema é aplicado via variáveis CSS no index.css.
 */
export const theme = {
  // Cor primária do cliente (sidebar, botões, destaques)
  primary: {
    DEFAULT: '#3B82F6',  // blue-500
    light: '#EFF6FF',    // blue-50
    dark: '#1D4ED8',     // blue-700
    foreground: '#FFFFFF',
  },
  // Cor de fundo do sidebar
  sidebar: {
    background: '#1E3A5F',
    text: '#E2E8F0',
    active: '#3B82F6',
  },
} as const

export type Theme = typeof theme
```

### `src/types/api.types.ts`

```ts
/**
 * Tipos de resposta padrão para as service functions.
 * Todas as funções em services/ devem retornar esses tipos.
 */

// Resposta paginada do PostgREST
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}

// Filtros comuns reutilizáveis
export interface DateRangeFilter {
  from: string   // ISO 8601
  to: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}
```

### `src/types/index.ts`

```ts
// Re-export central de todos os tipos
export type { PaginatedResponse, DateRangeFilter, PaginationParams } from './api.types'
// database.types.ts é gerado pelo Supabase CLI — não editar manualmente
export type { Database } from './database.types'
```

### `src/store/ui.store.ts`

```ts
import { create } from 'zustand'

interface UIStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (value: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
}))
```

### `src/store/auth.store.ts`

```ts
import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  session: Session | null
  businessId: string | null
  setAuth: (user: User | null, session: Session | null) => void
  setBusinessId: (id: string | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  businessId: null,
  setAuth: (user, session) => set({ user, session }),
  setBusinessId: (businessId) => set({ businessId }),
  clear: () => set({ user: null, session: null, businessId: null }),
}))
```

### `src/hooks/useAuth.ts`

```ts
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'

/**
 * Hook global de autenticação.
 * Inicializa e mantém sincronizado o estado de auth com o Supabase.
 * Deve ser usado uma única vez, no App.tsx.
 */
export function useAuth() {
  const { setAuth, setBusinessId, clear } = useAuthStore()

  useEffect(() => {
    // Recupera sessão existente ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user ?? null, session)
    })

    // Escuta mudanças de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setAuth(session?.user ?? null, session)

        if (session?.user) {
          // Busca o business_id do usuário logado
          const { data } = await supabase
            .from('business_users')
            .select('business_id')
            .eq('user_id', session.user.id)
            .single()

          setBusinessId(data?.business_id ?? null)
        } else {
          clear()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setAuth, setBusinessId, clear])

  return useAuthStore()
}
```

### `src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants'
import { AppLayout } from '@/components/layout/AppLayout'

// Páginas — lazy load por rota
import { lazy, Suspense } from 'react'
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const AppointmentsPage = lazy(() => import('@/features/appointments/pages/AppointmentsPage'))
const ClientsPage = lazy(() => import('@/features/clients/pages/ClientsPage'))
const ConversationsPage = lazy(() => import('@/features/conversations/pages/ConversationsPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))

function AppRoutes() {
  const { user } = useAuth()

  // Guarda de autenticação: redireciona para login se não autenticado
  if (!user) {
    return (
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    )
  }

  return (
    <AppLayout>
      <Suspense fallback={<div>Carregando...</div>}>
        <Routes>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.APPOINTMENTS} element={<AppointmentsPage />} />
          <Route path={ROUTES.CLIENTS} element={<ClientsPage />} />
          <Route path={ROUTES.CONVERSATIONS} element={<ConversationsPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### `src/test/setup.ts`

```ts
import '@testing-library/jest-dom'
```

### `.env.example`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## PASSO 6 — PADRÃO DE COMPONENTE (seguir sempre)

Todo componente em `components/shared/` e `features/*/components/` segue esse padrão:

```tsx
// LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Componente com tipagem explícita e props documentadas
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cn('animate-spin rounded-full border-2 border-primary border-t-transparent', sizes[size], className)}
    />
  )
}
```

```tsx
// LoadingSpinner.test.tsx
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('deve renderizar com acessibilidade correta', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
```

```ts
// index.ts — barrel export
export { LoadingSpinner } from './LoadingSpinner'
```

---

## PASSO 7 — PADRÃO DE SERVICE (seguir sempre)

Toda função de acesso a dados fica em `services/` e segue esse padrão:

```ts
// appointments.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import type { PaginatedResponse, DateRangeFilter, PaginationParams } from '@/types'

// Tipos derivados do banco — sempre tipado pela Database
type Appointment = Database['public']['Tables']['appointments']['Row']
type AppointmentWithRelations = Appointment & {
  clients: Pick<Database['public']['Tables']['clients']['Row'], 'name' | 'phone'>
  professionals: Pick<Database['public']['Tables']['professionals']['Row'], 'name'>
  services: Pick<Database['public']['Tables']['services']['Row'], 'name' | 'duration_min' | 'price'>
}

// Parâmetros tipados para filtros específicos da feature
interface GetAppointmentsParams extends PaginationParams {
  status?: Appointment['status']
  dateRange?: DateRangeFilter
}

export async function getAppointments(
  params: GetAppointmentsParams
): Promise<PaginatedResponse<AppointmentWithRelations>> {
  const { page, pageSize, status, dateRange } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('appointments')
    .select('*, clients(name, phone), professionals(name), services(name, duration_min, price)', {
      count: 'exact',
    })
    .order('scheduled_at', { ascending: true })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (dateRange) query = query.gte('scheduled_at', dateRange.from).lte('scheduled_at', dateRange.to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: data as AppointmentWithRelations[],
    count: count ?? 0,
    page,
    pageSize,
  }
}
```

---

## PASSO 8 — PADRÃO DE HOOK DE QUERY (seguir sempre)

Hooks de dados ficam dentro de `features/*/hooks/` e encapsulam o TanStack Query:

```ts
// features/appointments/hooks/useAppointments.ts
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { getAppointments } from '@/services/appointments.service'

interface UseAppointmentsParams {
  page?: number
  pageSize?: number
  status?: string
}

export function useAppointments({ page = 1, pageSize = 20, status }: UseAppointmentsParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.APPOINTMENTS, { page, pageSize, status }],
    queryFn: () => getAppointments({ page, pageSize, status: status as any }),
  })
}
```

---

## PASSO 9 — GERAR TIPOS DO SUPABASE

Após o ambiente estar configurado, rode:

```bash
npx supabase gen types typescript --project-id <seu-project-id> > src/types/database.types.ts
```

Isso gera o arquivo `database.types.ts` automaticamente com todos os tipos do banco. **Nunca editar esse arquivo manualmente.**

---

## RESUMO DO QUE VOCÊ DEVE CRIAR

Ao executar esse prompt, você deve:

1. Instalar todas as dependências listadas
2. Criar a estrutura de pastas completa
3. Criar todos os arquivos base listados no Passo 5
4. Configurar ESLint, Prettier, Husky e Vitest
5. Configurar o `tsconfig.json` com strict mode e path aliases
6. Configurar o `vite.config.ts` com alias `@/`
7. Instalar os componentes shadcn/ui base: `button`, `input`, `label`, `badge`, `dialog`, `dropdown-menu`, `select`, `table`, `tabs`, `toast`, `card`, `avatar`, `separator`
8. Criar um componente `LoadingSpinner` em `components/shared/` seguindo o padrão do Passo 6, com teste
9. Criar stubs vazios (página com `<h1>` temporário) para todas as features: `auth`, `dashboard`, `appointments`, `clients`, `conversations`, `professionals`, `services`, `settings`
10. Verificar que `npm run lint`, `npm run type-check` e `npm test` rodam sem erros
