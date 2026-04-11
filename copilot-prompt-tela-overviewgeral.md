# Prompt: Tela Overview (Dashboard)

> Cole no GitHub Copilot Chat (modo Agent).
> Layout base já está pronto (Sidebar, Topbar, PageWrapper, AppLayout).

---

## CONTEXTO

A tela de Overview é a home do dashboard — primeira coisa que o dono vê ao logar.
Precisa mostrar de forma rápida e visual o que está acontecendo no negócio hoje.

**Composta por 3 blocos:**
1. Cards de métricas do dia
2. Gráfico de agendamentos por período
3. Lista dos próximos agendamentos do dia

---

## BANCO DE DADOS — TABELAS RELEVANTES

```
appointments:
  id, business_id, client_id, professional_id, service_id,
  scheduled_at, ends_at, status, source, created_at

  status enum: pending | confirmed | cancelled_by_client |
               cancelled_by_business | cancelled_auto | completed | no_show

clients:
  id, business_id, name, phone, last_contact_at

conversation_sessions:
  id, business_id, status (active | human_takeover | closed)
```

---

## PASSO 1 — INSTALAR DEPENDÊNCIAS

```bash
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add select
npm install recharts
```

---

## PASSO 2 — CRIAR SERVICE `src/services/dashboard.service.ts`

```ts
import { supabase } from '@/lib/supabase'

// Intervalo de datas para hoje (início e fim do dia em UTC)
function getTodayRange() {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

export interface DayMetrics {
  appointmentsTotal: number
  appointmentsConfirmed: number
  appointmentsPending: number
  appointmentsCancelled: number
  newClients: number
  activeConversations: number
}

// Busca métricas do dia atual
export async function getDayMetrics(): Promise<DayMetrics> {
  const { start, end } = getTodayRange()

  const [appointments, newClients, activeConversations] = await Promise.all([
    supabase
      .from('appointments')
      .select('status')
      .gte('scheduled_at', start)
      .lte('scheduled_at', end),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .gte('first_contact_at', start)
      .lte('first_contact_at', end),
    supabase
      .from('conversation_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const appts = appointments.data ?? []

  return {
    appointmentsTotal: appts.length,
    appointmentsConfirmed: appts.filter((a) => a.status === 'confirmed').length,
    appointmentsPending: appts.filter((a) => a.status === 'pending').length,
    appointmentsCancelled: appts.filter((a) =>
      ['cancelled_by_client', 'cancelled_by_business', 'cancelled_auto'].includes(a.status)
    ).length,
    newClients: newClients.count ?? 0,
    activeConversations: activeConversations.count ?? 0,
  }
}

export interface ChartDataPoint {
  date: string   // "DD/MM"
  confirmed: number
  cancelled: number
  completed: number
}

// Busca agendamentos dos últimos N dias para o gráfico
export async function getAppointmentsChartData(days = 7): Promise<ChartDataPoint[]> {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('appointments')
    .select('scheduled_at, status')
    .gte('scheduled_at', start.toISOString())
    .lte('scheduled_at', end.toISOString())

  // Agrupa por dia
  const map = new Map<string, ChartDataPoint>()

  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    map.set(key, { date: key, confirmed: 0, cancelled: 0, completed: 0 })
  }

  for (const appt of data ?? []) {
    const d = new Date(appt.scheduled_at)
    const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const entry = map.get(key)
    if (!entry) continue
    if (appt.status === 'confirmed') entry.confirmed++
    else if (appt.status === 'completed') entry.completed++
    else if (['cancelled_by_client', 'cancelled_by_business', 'cancelled_auto'].includes(appt.status))
      entry.cancelled++
  }

  return Array.from(map.values())
}

export interface UpcomingAppointment {
  id: string
  scheduled_at: string
  ends_at: string
  status: string
  clients: { name: string | null; phone: string } | null
  professionals: { display_name: string } | null
  services: { name: string; duration_min: number } | null
}

// Busca próximos agendamentos do dia (a partir de agora)
export async function getUpcomingAppointments(limit = 8): Promise<UpcomingAppointment[]> {
  const now = new Date().toISOString()
  const { start, end } = getTodayRange()

  const { data } = await supabase
    .from('appointments')
    .select(`
      id, scheduled_at, ends_at, status,
      clients(name, phone),
      professionals(display_name),
      services(name, duration_min)
    `)
    .gte('scheduled_at', now)
    .lte('scheduled_at', end)
    .in('status', ['pending', 'confirmed'])
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  return (data ?? []) as UpcomingAppointment[]
}
```

---

## PASSO 3 — CRIAR HOOKS `src/features/dashboard/hooks/useDashboard.ts`

```ts
import { useQuery } from '@tanstack/react-query'
import { getDayMetrics, getAppointmentsChartData, getUpcomingAppointments } from '@/services/dashboard.service'

export function useDayMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'day-metrics'],
    queryFn: getDayMetrics,
    // Atualiza a cada 2 minutos automaticamente
    refetchInterval: 1000 * 60 * 2,
  })
}

export function useAppointmentsChart(days: number) {
  return useQuery({
    queryKey: ['dashboard', 'chart', days],
    queryFn: () => getAppointmentsChartData(days),
  })
}

export function useUpcomingAppointments() {
  return useQuery({
    queryKey: ['dashboard', 'upcoming'],
    queryFn: getUpcomingAppointments,
    refetchInterval: 1000 * 60 * 2,
  })
}
```

---

## PASSO 4 — CRIAR COMPONENTE `src/features/dashboard/components/MetricCard.tsx`

```tsx
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  // Cor do ícone: blue | green | amber | red | gray
  color?: 'blue' | 'green' | 'amber' | 'red' | 'gray'
  loading?: boolean
}

const colorMap = {
  blue:  { bg: 'bg-blue-50',   icon: 'text-blue-500' },
  green: { bg: 'bg-green-50',  icon: 'text-green-600' },
  amber: { bg: 'bg-amber-50',  icon: 'text-amber-500' },
  red:   { bg: 'bg-red-50',    icon: 'text-red-500' },
  gray:  { bg: 'bg-gray-100',  icon: 'text-gray-500' },
}

export function MetricCard({ label, value, icon: Icon, color = 'blue', loading }: MetricCardProps) {
  const colors = colorMap[color]

  return (
    <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
        <Icon size={18} className={colors.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading
          ? <Skeleton className="h-6 w-12 mt-0.5" />
          : <p className="text-xl font-semibold text-foreground leading-tight">{value}</p>
        }
      </div>
    </div>
  )
}
```

---

## PASSO 5 — CRIAR COMPONENTE `src/features/dashboard/components/AppointmentsChart.tsx`

```tsx
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppointmentsChart } from '../hooks/useDashboard'

const PERIOD_OPTIONS = [
  { label: 'Últimos 7 dias',  value: '7' },
  { label: 'Últimos 14 dias', value: '14' },
  { label: 'Últimos 30 dias', value: '30' },
]

export function AppointmentsChart() {
  const [days, setDays] = useState(7)
  const { data, isLoading } = useAppointmentsChart(days)

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-medium text-foreground">Agendamentos por período</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Confirmados, concluídos e cancelados</p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-52 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data} barSize={10} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="confirmed" name="Confirmados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Concluídos"  fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cancelled" name="Cancelados"  fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
```

---

## PASSO 6 — CRIAR COMPONENTE `src/features/dashboard/components/UpcomingAppointments.tsx`

```tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpcomingAppointments } from '../hooks/useDashboard'
import { cn } from '@/lib/utils'

// Mapeia status para label e cor do badge
const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending:   { label: 'Pendente',   variant: 'secondary' },
  confirmed: { label: 'Confirmado', variant: 'default' },
}

export function UpcomingAppointments() {
  const { data: appointments, isLoading } = useUpcomingAppointments()

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={16} className="text-muted-foreground" />
        <h2 className="text-sm font-medium text-foreground">Próximos agendamentos</h2>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      )}

      {!isLoading && (!appointments || appointments.length === 0) && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CalendarDays size={32} className="text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje</p>
        </div>
      )}

      {!isLoading && appointments && appointments.length > 0 && (
        <div className="space-y-2">
          {appointments.map((appt) => {
            const status = STATUS_MAP[appt.status] ?? { label: appt.status, variant: 'outline' as const }
            const time = format(new Date(appt.scheduled_at), 'HH:mm', { locale: ptBR })

            return (
              <div
                key={appt.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                  'border border-border hover:bg-muted/40 transition-colors'
                )}
              >
                {/* Horário */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground w-12 flex-shrink-0">
                  <Clock size={12} />
                  <span>{time}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {appt.clients?.name ?? appt.clients?.phone ?? 'Cliente'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {appt.services?.name} · {appt.professionals?.display_name}
                  </p>
                </div>

                {/* Status */}
                <Badge variant={status.variant} className="text-xs flex-shrink-0">
                  {status.label}
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

---

## PASSO 7 — CRIAR `src/features/dashboard/pages/DashboardPage.tsx`

```tsx
import { CalendarDays, CheckCircle, Clock, Users, MessageSquare } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { MetricCard } from '../components/MetricCard'
import { AppointmentsChart } from '../components/AppointmentsChart'
import { UpcomingAppointments } from '../components/UpcomingAppointments'
import { useDayMetrics } from '../hooks/useDashboard'

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDayMetrics()

  return (
    <PageWrapper
      title="Overview"
      description="Resumo do dia de hoje"
    >
      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <MetricCard
          label="Agendamentos hoje"
          value={metrics?.appointmentsTotal ?? 0}
          icon={CalendarDays}
          color="blue"
          loading={isLoading}
        />
        <MetricCard
          label="Confirmados"
          value={metrics?.appointmentsConfirmed ?? 0}
          icon={CheckCircle}
          color="green"
          loading={isLoading}
        />
        <MetricCard
          label="Pendentes"
          value={metrics?.appointmentsPending ?? 0}
          icon={Clock}
          color="amber"
          loading={isLoading}
        />
        <MetricCard
          label="Novos clientes"
          value={metrics?.newClients ?? 0}
          icon={Users}
          color="gray"
          loading={isLoading}
        />
        <MetricCard
          label="Conversas ativas"
          value={metrics?.activeConversations ?? 0}
          icon={MessageSquare}
          color="blue"
          loading={isLoading}
        />
      </div>

      {/* Gráfico + Próximos agendamentos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <AppointmentsChart />
        </div>
        <div className="xl:col-span-1">
          <UpcomingAppointments />
        </div>
      </div>
    </PageWrapper>
  )
}
```

---

## PASSO 8 — CRIAR `src/features/dashboard/index.ts`

```ts
export { default as DashboardPage } from './pages/DashboardPage'
export { MetricCard } from './components/MetricCard'
export { AppointmentsChart } from './components/AppointmentsChart'
export { UpcomingAppointments } from './components/UpcomingAppointments'
```

---

## VERIFICAÇÃO FINAL

- [ ] `/dashboard` renderiza sem erros
- [ ] 5 MetricCards aparecem com valor 0 (banco vazio é esperado)
- [ ] Gráfico renderiza com barras vazias e selector de período funciona
- [ ] Bloco de próximos agendamentos mostra estado vazio com ícone
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem warnings
