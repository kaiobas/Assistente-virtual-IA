# Prompt: Tela Agendamentos

> Cole no GitHub Copilot Chat (modo Agent).
> Layout base e tela Overview já estão prontos.

---

## CONTEXTO

A tela de agendamentos tem duas visões alternáveis:
- **Lista** — tabela com filtros por status e data, ações de confirmar/cancelar/no-show
- **Calendário** — visualização visual por dia/semana

E um modal para **criar agendamento manualmente** pelo dashboard.

---

## BANCO DE DADOS — TABELAS RELEVANTES

```
appointments:
  id, business_id, client_id, professional_id, service_id,
  scheduled_at, ends_at, status, source, notes, cancelled_reason, created_at

  status enum: pending | confirmed | cancelled_by_client |
               cancelled_by_business | cancelled_auto | completed | no_show
  source enum: whatsapp | dashboard | manual

clients:        id, name, phone
professionals:  id, display_name, specialty
services:       id, name, duration_min, price

appointment_status_history:
  id, appointment_id, from_status, to_status, changed_by, reason, created_at
```

**Profissionais existentes no banco:**
- Henrique de Ferraz (id: b1b2c3d4-0001-4000-8000-000000000001)
- Gustavo Cruz (id: b1b2c3d4-0002-4000-8000-000000000002)

**Serviços existentes:** Corte, Corte e Barba, Corte e Sobrancelha, Corte Barba e Sobrancelha, Barba Terapia, entre outros (10 no total).

---

## PASSO 1 — INSTALAR COMPONENTES shadcn/ui

```bash
npx shadcn@latest add dialog
npx shadcn@latest add popover
npx shadcn@latest add calendar
npx shadcn@latest add command
npx shadcn@latest add alert-dialog
npx shadcn@latest add textarea
npx shadcn@latest add tabs
npx shadcn@latest add skeleton
npx shadcn@latest add scroll-area
npm install @dnd-kit/core @dnd-kit/sortable
```

---

## PASSO 2 — CRIAR SERVICE `src/services/appointments.service.ts`

```ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type AppointmentStatus = Database['public']['Enums']['appointment_status']

export interface AppointmentFilters {
  status?: AppointmentStatus
  dateFrom?: string
  dateTo?: string
  professionalId?: string
  page?: number
  pageSize?: number
}

export interface AppointmentRow {
  id: string
  scheduled_at: string
  ends_at: string
  status: AppointmentStatus
  source: string
  notes: string | null
  cancelled_reason: string | null
  created_at: string
  clients: { id: string; name: string | null; phone: string } | null
  professionals: { id: string; display_name: string; specialty: string | null } | null
  services: { id: string; name: string; duration_min: number; price: number } | null
}

// Busca agendamentos com filtros e paginação
export async function getAppointments(filters: AppointmentFilters = {}) {
  const { status, dateFrom, dateTo, professionalId, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('appointments')
    .select(
      `id, scheduled_at, ends_at, status, source, notes, cancelled_reason, created_at,
       clients(id, name, phone),
       professionals(id, display_name, specialty),
       services(id, name, duration_min, price)`,
      { count: 'exact' }
    )
    .order('scheduled_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (dateFrom) query = query.gte('scheduled_at', dateFrom)
  if (dateTo) query = query.lte('scheduled_at', dateTo)
  if (professionalId) query = query.eq('professional_id', professionalId)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as AppointmentRow[], count: count ?? 0 }
}

// Busca agendamentos de um intervalo de datas para o calendário
export async function getAppointmentsByDateRange(dateFrom: string, dateTo: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `id, scheduled_at, ends_at, status,
       clients(name, phone),
       professionals(display_name),
       services(name, duration_min)`
    )
    .gte('scheduled_at', dateFrom)
    .lte('scheduled_at', dateTo)
    .not('status', 'in', '("cancelled_by_client","cancelled_by_business","cancelled_auto")')
    .order('scheduled_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export interface CreateAppointmentPayload {
  client_id: string
  professional_id: string
  service_id: string
  scheduled_at: string
  notes?: string
}

// Cria agendamento manual com cálculo automático de ends_at
export async function createAppointment(payload: CreateAppointmentPayload) {
  // Busca duração do serviço para calcular ends_at
  const { data: service, error: svcError } = await supabase
    .from('services')
    .select('duration_min')
    .eq('id', payload.service_id)
    .single()

  if (svcError || !service) throw new Error('Serviço não encontrado')

  const scheduledAt = new Date(payload.scheduled_at)
  const endsAt = new Date(scheduledAt.getTime() + service.duration_min * 60 * 1000)

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      client_id: payload.client_id,
      professional_id: payload.professional_id,
      service_id: payload.service_id,
      scheduled_at: scheduledAt.toISOString(),
      ends_at: endsAt.toISOString(),
      notes: payload.notes ?? null,
      status: 'confirmed',
      source: 'dashboard',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Atualiza status de um agendamento
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  reason?: string
) {
  const update: Record<string, unknown> = { status }
  if (reason) update.cancelled_reason = reason

  const { error } = await supabase
    .from('appointments')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Busca profissionais para os selects do formulário
export async function getProfessionals() {
  const { data, error } = await supabase
    .from('professionals')
    .select('id, display_name, specialty')
    .eq('active', true)
    .order('display_name')

  if (error) throw new Error(error.message)
  return data ?? []
}

// Busca serviços para os selects do formulário
export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, duration_min, price, category')
    .eq('active', true)
    .order('category')

  if (error) throw new Error(error.message)
  return data ?? []
}

// Busca clientes para o combobox de busca
export async function searchClients(query: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10)

  if (error) throw new Error(error.message)
  return data ?? []
}
```

---

## PASSO 3 — CRIAR HOOKS `src/features/appointments/hooks/useAppointments.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getAppointments,
  getAppointmentsByDateRange,
  createAppointment,
  updateAppointmentStatus,
  getProfessionals,
  getServices,
  searchClients,
  type AppointmentFilters,
  type CreateAppointmentPayload,
} from '@/services/appointments.service'
import type { Database } from '@/types/database.types'

type AppointmentStatus = Database['public']['Enums']['appointment_status']

export function useAppointments(filters: AppointmentFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.APPOINTMENTS, filters],
    queryFn: () => getAppointments(filters),
  })
}

export function useAppointmentsByDateRange(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.APPOINTMENTS, 'calendar', dateFrom, dateTo],
    queryFn: () => getAppointmentsByDateRange(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => createAppointment(payload),
    onSuccess: () => {
      // Invalida todas as queries de appointments para refetch automático
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPOINTMENTS] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: AppointmentStatus; reason?: string }) =>
      updateAppointmentStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPOINTMENTS] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useProfessionals() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFESSIONALS],
    queryFn: getProfessionals,
    staleTime: 1000 * 60 * 10, // 10 min — muda raramente
  })
}

export function useServices() {
  return useQuery({
    queryKey: [QUERY_KEYS.SERVICES],
    queryFn: getServices,
    staleTime: 1000 * 60 * 10,
  })
}

export function useSearchClients(query: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENTS, 'search', query],
    queryFn: () => searchClients(query),
    enabled: query.length >= 2,
  })
}
```

---

## PASSO 4 — CRIAR COMPONENTE DE STATUS BADGE `src/features/appointments/components/AppointmentStatusBadge.tsx`

```tsx
import { Badge } from '@/components/ui/badge'

type Status =
  | 'pending' | 'confirmed' | 'completed' | 'no_show'
  | 'cancelled_by_client' | 'cancelled_by_business' | 'cancelled_auto'

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  pending:               { label: 'Pendente',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed:             { label: 'Confirmado',  className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:             { label: 'Concluído',   className: 'bg-green-50 text-green-700 border-green-200' },
  no_show:               { label: 'Não compareceu', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled_by_client:   { label: 'Cancelado (cliente)',  className: 'bg-red-50 text-red-700 border-red-200' },
  cancelled_by_business: { label: 'Cancelado (negócio)', className: 'bg-red-50 text-red-700 border-red-200' },
  cancelled_auto:        { label: 'Cancelado (auto)',     className: 'bg-red-50 text-red-700 border-red-200' },
}

interface AppointmentStatusBadgeProps {
  status: Status
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: '' }
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
```

---

## PASSO 5 — CRIAR MODAL DE CRIAÇÃO `src/features/appointments/components/CreateAppointmentModal.tsx`

```tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useCreateAppointment, useProfessionals, useServices, useSearchClients } from '../hooks/useAppointments'

const schema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  professionalId: z.string().min(1, 'Selecione um profissional'),
  serviceId: z.string().min(1, 'Selecione um serviço'),
  date: z.date({ required_error: 'Selecione uma data' }),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CreateAppointmentModalProps {
  open: boolean
  onClose: () => void
}

export function CreateAppointmentModal({ open, onClose }: CreateAppointmentModalProps) {
  const [clientSearch, setClientSearch] = useState('')
  const { data: professionals } = useProfessionals()
  const { data: services } = useServices()
  const { data: clients } = useSearchClients(clientSearch)
  const createMutation = useCreateAppointment()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { time: '09:00' },
  })

  const selectedDate = watch('date')

  async function onSubmit(data: FormData) {
    const [hours, minutes] = data.time.split(':').map(Number)
    const scheduledAt = new Date(data.date)
    scheduledAt.setHours(hours, minutes, 0, 0)

    await createMutation.mutateAsync({
      client_id: data.clientId,
      professional_id: data.professionalId,
      service_id: data.serviceId,
      scheduled_at: scheduledAt.toISOString(),
      notes: data.notes,
    })

    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Cliente — busca por nome ou telefone */}
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
            {clients && clients.length > 0 && clientSearch.length >= 2 && (
              <div className="border rounded-md divide-y max-h-36 overflow-y-auto">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => {
                      setValue('clientId', c.id)
                      setClientSearch(c.name ?? c.phone)
                    }}
                  >
                    <span className="font-medium">{c.name ?? 'Sem nome'}</span>
                    <span className="text-muted-foreground ml-2">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
          </div>

          {/* Profissional */}
          <div className="space-y-1.5">
            <Label>Profissional</Label>
            <Select onValueChange={(v) => setValue('professionalId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {professionals?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.professionalId && <p className="text-xs text-destructive">{errors.professionalId.message}</p>}
          </div>

          {/* Serviço */}
          <div className="space-y-1.5">
            <Label>Serviço</Label>
            <Select onValueChange={(v) => setValue('serviceId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {services?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {s.duration_min}min · R$ {Number(s.price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceId && <p className="text-xs text-destructive">{errors.serviceId.message}</p>}
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !selectedDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon size={14} className="mr-2" />
                    {selectedDate
                      ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setValue('date', d)}
                    locale={ptBR}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Input type="time" {...register('time')} />
              {errors.time && <p className="text-xs text-destructive">{errors.time.message}</p>}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label>Observações <span className="text-muted-foreground">(opcional)</span></Label>
            <Textarea {...register('notes')} placeholder="Alguma observação..." rows={2} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Criando...' : 'Criar agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## PASSO 6 — CRIAR VISÃO DE LISTA `src/features/appointments/components/AppointmentsList.tsx`

```tsx
import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle, XCircle, AlertCircle, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { useAppointments, useUpdateAppointmentStatus } from '../hooks/useAppointments'
import type { Database } from '@/types/database.types'

type AppointmentStatus = Database['public']['Enums']['appointment_status']

const STATUS_FILTER_OPTIONS = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Pendentes',       value: 'pending' },
  { label: 'Confirmados',     value: 'confirmed' },
  { label: 'Concluídos',      value: 'completed' },
  { label: 'Cancelados',      value: 'cancelled_by_business' },
  { label: 'Não compareceu',  value: 'no_show' },
]

export function AppointmentsList() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  const { data, isLoading } = useAppointments({
    status: statusFilter !== 'all' ? (statusFilter as AppointmentStatus) : undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const updateStatus = useUpdateAppointmentStatus()

  function handleAction(id: string, status: AppointmentStatus) {
    updateStatus.mutate({ id, status })
  }

  const appointments = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {total} agendamento{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Data e hora</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Profissional</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Serviço</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Origem</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && [...Array(6)].map((_, i) => (
              <tr key={i}>
                {[...Array(7)].map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}

            {!isLoading && appointments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Nenhum agendamento encontrado
                </td>
              </tr>
            )}

            {!isLoading && appointments.map((appt) => (
              <tr key={appt.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-medium">
                    {format(new Date(appt.scheduled_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {format(new Date(appt.scheduled_at), 'HH:mm')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{appt.clients?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{appt.clients?.phone}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {appt.professionals?.display_name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <p>{appt.services?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{appt.services?.duration_min}min</p>
                </td>
                <td className="px-4 py-3">
                  <AppointmentStatusBadge status={appt.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                  {appt.source === 'whatsapp' ? '📱 WhatsApp' : '🖥️ Dashboard'}
                </td>
                <td className="px-4 py-3">
                  {/* Ações disponíveis por status */}
                  {['pending', 'confirmed'].includes(appt.status) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {appt.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleAction(appt.id, 'confirmed')}>
                            <CheckCircle size={14} className="mr-2 text-green-600" />
                            Confirmar
                          </DropdownMenuItem>
                        )}
                        {appt.status === 'confirmed' && (
                          <DropdownMenuItem onClick={() => handleAction(appt.id, 'completed')}>
                            <CheckCircle size={14} className="mr-2 text-blue-600" />
                            Marcar concluído
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleAction(appt.id, 'no_show')}>
                          <AlertCircle size={14} className="mr-2 text-gray-500" />
                          Não compareceu
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleAction(appt.id, 'cancelled_by_business')}
                        >
                          <XCircle size={14} className="mr-2" />
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## PASSO 7 — CRIAR VISÃO DE CALENDÁRIO `src/features/appointments/components/AppointmentsCalendar.tsx`

```tsx
import { useState, useMemo } from 'react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppointmentsByDateRange } from '../hooks/useAppointments'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'

// Horas exibidas no calendário (08h às 20h)
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)

export function AppointmentsCalendar() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // segunda-feira
  )

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const { data: appointments, isLoading } = useAppointmentsByDateRange(
    weekStart.toISOString(),
    weekEnd.toISOString()
  )

  // Agrupa agendamentos por dia
  const byDay = useMemo(() => {
    const map = new Map<string, typeof appointments>()
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd')
      map.set(key, (appointments ?? []).filter((a) =>
        isSameDay(new Date(a.scheduled_at), day)
      ))
    }
    return map
  }, [appointments, days])

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Navegação da semana */}
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart((w) => subWeeks(w, 1))}>
          <ChevronLeft size={16} />
        </Button>
        <span className="text-sm font-medium">
          {format(weekStart, "d 'de' MMMM", { locale: ptBR })} —{' '}
          {format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Header dos dias */}
      <div className="grid grid-cols-8 border-b">
        <div className="py-2 px-3 text-xs text-muted-foreground" /> {/* coluna de horas */}
        {days.map((day) => (
          <div key={day.toISOString()} className="py-2 px-2 text-center border-l">
            <p className="text-xs text-muted-foreground uppercase">
              {format(day, 'EEE', { locale: ptBR })}
            </p>
            <p className={`text-sm font-medium mt-0.5 ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Grade de horários */}
      <div className="overflow-y-auto max-h-[520px]">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-0 min-h-[56px]">
              {/* Label da hora */}
              <div className="px-3 py-2 text-xs text-muted-foreground flex-shrink-0">
                {String(hour).padStart(2, '0')}:00
              </div>
              {/* Células por dia */}
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const dayAppts = byDay.get(key) ?? []
                const hourAppts = dayAppts.filter((a) => {
                  const h = new Date(a.scheduled_at).getHours()
                  return h === hour
                })

                return (
                  <div key={day.toISOString()} className="border-l px-1 py-1 space-y-1">
                    {hourAppts.map((appt) => (
                      <div
                        key={appt.id}
                        className="bg-blue-50 border border-blue-200 rounded px-1.5 py-1 text-xs cursor-pointer hover:bg-blue-100 transition-colors"
                      >
                        <p className="font-medium text-blue-800 truncate">
                          {format(new Date(appt.scheduled_at), 'HH:mm')} {(appt.clients as any)?.name ?? 'Cliente'}
                        </p>
                        <p className="text-blue-600 truncate">{(appt.services as any)?.name}</p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

---

## PASSO 8 — CRIAR `src/features/appointments/pages/AppointmentsPage.tsx`

```tsx
import { useState } from 'react'
import { Plus, List, CalendarDays } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppointmentsList } from '../components/AppointmentsList'
import { AppointmentsCalendar } from '../components/AppointmentsCalendar'
import { CreateAppointmentModal } from '../components/CreateAppointmentModal'

export default function AppointmentsPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <PageWrapper
      title="Agendamentos"
      description="Gerencie todos os agendamentos do negócio"
      action={
        <div className="flex items-center gap-3">
          {/* Toggle de visão */}
          <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
            <TabsList className="h-9">
              <TabsTrigger value="list" className="gap-1.5 text-xs">
                <List size={14} />
                Lista
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5 text-xs">
                <CalendarDays size={14} />
                Calendário
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Botão novo agendamento */}
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus size={15} />
            Novo agendamento
          </Button>
        </div>
      }
    >
      {view === 'list' ? <AppointmentsList /> : <AppointmentsCalendar />}

      <CreateAppointmentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </PageWrapper>
  )
}
```

---

## PASSO 9 — CRIAR `src/features/appointments/index.ts`

```ts
export { default as AppointmentsPage } from './pages/AppointmentsPage'
export { AppointmentStatusBadge } from './components/AppointmentStatusBadge'
```

---

## VERIFICAÇÃO FINAL

- [ ] `/appointments` renderiza sem erros
- [ ] Toggle Lista / Calendário funciona
- [ ] Filtro de status filtra a tabela
- [ ] Estado vazio exibe mensagem correta
- [ ] Modal "Novo agendamento" abre e valida os campos
- [ ] Selects de profissional e serviço carregam os dados do banco
- [ ] Ações de confirmar/cancelar/no-show aparecem no dropdown
- [ ] Calendário navega entre semanas
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem warnings
