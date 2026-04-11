# Prompt: Tela Notificações

> Cole no GitHub Copilot Chat (modo Agent).
> Branch: kaio — todas as outras telas já estão prontas.

---

## CONTEXTO

A tela de notificações tem duas visões em abas:
- **Fila** — notificações pendentes agendadas para envio (o n8n processa e envia)
- **Histórico** — log imutável de tudo que já foi enviado, com status de entrega

O dashboard é **somente leitura** nessa tela — quem escreve é o n8n.
O dono pode apenas visualizar e cancelar notificações pendentes.

---

## BANCO DE DADOS — TABELAS

```
notification_queue:
  id, appointment_id, client_id,
  type enum: reminder_d1 | reminder_h2 | confirmation_request |
             cancellation_notice | booking_confirmed | booking_created
  send_at (timestamptz — quando o n8n vai enviar)
  status enum: pending | sent | failed | cancelled
  expires_at (timestamptz — após esse prazo vira no_show)
  attempts (int — contador de tentativas)
  created_at
  → joins: clients(name, phone), appointments(scheduled_at, services(name))

notification_log:
  id, queue_id, appointment_id,
  channel enum: whatsapp | sms | email
  message_body (text — conteúdo enviado)
  sent_at
  delivery_status enum: delivered | read | failed | unknown
  error_message (nullable)
  → joins: appointments(scheduled_at, clients(name, phone), services(name))
```

---

## PASSO 1 — CRIAR SERVICE `src/services/notifications.service.ts`

```ts
import { supabase } from '@/lib/supabase'

export interface NotificationQueueItem {
  id: string
  type: string
  send_at: string
  status: string
  expires_at: string | null
  attempts: number
  created_at: string
  clients: { name: string | null; phone: string } | null
  appointments: {
    scheduled_at: string
    services: { name: string } | null
  } | null
}

export interface NotificationLogItem {
  id: string
  queue_id: string
  channel: string
  message_body: string
  sent_at: string
  delivery_status: string
  error_message: string | null
  appointments: {
    scheduled_at: string
    clients: { name: string | null; phone: string } | null
    services: { name: string } | null
  } | null
}

export interface NotificationFilters {
  status?: string
  type?: string
  page?: number
  pageSize?: number
}

// Busca fila de notificações
export async function getNotificationQueue(filters: NotificationFilters = {}) {
  const { status, type, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('notification_queue')
    .select(
      `id, type, send_at, status, expires_at, attempts, created_at,
       clients(name, phone),
       appointments(scheduled_at, services(name))`,
      { count: 'exact' }
    )
    .order('send_at', { ascending: true })
    .range(from, to)

  if (status && status !== 'all') query = query.eq('status', status)
  if (type && type !== 'all') query = query.eq('type', type)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as NotificationQueueItem[], count: count ?? 0 }
}

// Busca log de notificações enviadas
export async function getNotificationLog(filters: NotificationFilters = {}) {
  const { page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('notification_log')
    .select(
      `id, queue_id, channel, message_body, sent_at, delivery_status, error_message,
       appointments(scheduled_at, clients(name, phone), services(name))`,
      { count: 'exact' }
    )
    .order('sent_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)

  return { data: (data ?? []) as NotificationLogItem[], count: count ?? 0 }
}

// Cancela uma notificação pendente
export async function cancelNotification(id: string) {
  const { error } = await supabase
    .from('notification_queue')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'pending') // só cancela se ainda pendente

  if (error) throw new Error(error.message)
}

// Métricas rápidas para os cards do topo
export async function getNotificationMetrics() {
  const [pending, sent, failed] = await Promise.all([
    supabase
      .from('notification_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('notification_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent'),
    supabase
      .from('notification_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed'),
  ])

  return {
    pending: pending.count ?? 0,
    sent: sent.count ?? 0,
    failed: failed.count ?? 0,
  }
}
```

---

## PASSO 2 — CRIAR HOOKS `src/features/notifications/hooks/useNotifications.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getNotificationQueue,
  getNotificationLog,
  cancelNotification,
  getNotificationMetrics,
  type NotificationFilters,
} from '@/services/notifications.service'

export function useNotificationMetrics() {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, 'metrics'],
    queryFn: getNotificationMetrics,
    refetchInterval: 1000 * 60, // 1 minuto
  })
}

export function useNotificationQueue(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, 'queue', filters],
    queryFn: () => getNotificationQueue(filters),
    refetchInterval: 1000 * 30,
  })
}

export function useNotificationLog(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, 'log', filters],
    queryFn: () => getNotificationLog(filters),
  })
}

export function useCancelNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] })
    },
  })
}
```

---

## PASSO 3 — CRIAR `src/features/notifications/components/NotificationTypeBadge.tsx`

```tsx
import { Badge } from '@/components/ui/badge'

// Mapeamento legível de cada tipo de notificação
const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  reminder_d1:          { label: 'Lembrete D-1',    className: 'bg-blue-50 text-blue-700 border-blue-200' },
  reminder_h2:          { label: 'Lembrete 2h',     className: 'bg-blue-50 text-blue-700 border-blue-200' },
  confirmation_request: { label: 'Confirmação',     className: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancellation_notice:  { label: 'Cancelamento',    className: 'bg-red-50 text-red-700 border-red-200' },
  booking_confirmed:    { label: 'Agend. confirmado', className: 'bg-green-50 text-green-700 border-green-200' },
  booking_created:      { label: 'Agend. criado',   className: 'bg-green-50 text-green-700 border-green-200' },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pendente',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
  sent:      { label: 'Enviada',    className: 'bg-green-50 text-green-700 border-green-200' },
  failed:    { label: 'Falhou',     className: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelada', className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

const DELIVERY_CONFIG: Record<string, { label: string; className: string }> = {
  delivered: { label: 'Entregue', className: 'bg-green-50 text-green-700 border-green-200' },
  read:      { label: 'Lida',     className: 'bg-blue-50 text-blue-700 border-blue-200' },
  failed:    { label: 'Falhou',   className: 'bg-red-50 text-red-700 border-red-200' },
  unknown:   { label: 'Desconhecido', className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export function NotificationTypeBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] ?? { label: type, className: '' }
  return <Badge variant="outline" className={`text-xs ${config.className}`}>{config.label}</Badge>
}

export function NotificationStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: '' }
  return <Badge variant="outline" className={`text-xs ${config.className}`}>{config.label}</Badge>
}

export function DeliveryStatusBadge({ status }: { status: string }) {
  const config = DELIVERY_CONFIG[status] ?? { label: status, className: '' }
  return <Badge variant="outline" className={`text-xs ${config.className}`}>{config.label}</Badge>
}
```

---

## PASSO 4 — CRIAR `src/features/notifications/components/QueueTab.tsx`

```tsx
import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { XCircle, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { NotificationTypeBadge, NotificationStatusBadge } from './NotificationTypeBadge'
import { useNotificationQueue, useCancelNotification } from '../hooks/useNotifications'

const STATUS_OPTIONS = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Pendentes',       value: 'pending' },
  { label: 'Enviadas',        value: 'sent' },
  { label: 'Falhou',          value: 'failed' },
  { label: 'Canceladas',      value: 'cancelled' },
]

const TYPE_OPTIONS = [
  { label: 'Todos os tipos',    value: 'all' },
  { label: 'Lembrete D-1',     value: 'reminder_d1' },
  { label: 'Lembrete 2h',      value: 'reminder_h2' },
  { label: 'Confirmação',      value: 'confirmation_request' },
  { label: 'Cancelamento',     value: 'cancellation_notice' },
  { label: 'Agend. confirmado',value: 'booking_confirmed' },
  { label: 'Agend. criado',    value: 'booking_created' },
]

const PAGE_SIZE = 15

export function QueueTab() {
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useNotificationQueue({
    status: status !== 'all' ? status : undefined,
    type: type !== 'all' ? type : undefined,
    page,
    pageSize: PAGE_SIZE,
  })
  const cancel = useCancelNotification()

  const items = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" className="h-9 w-9 ml-auto" onClick={() => refetch()} title="Atualizar">
          <RefreshCw size={15} />
        </Button>

        <span className="text-sm text-muted-foreground">{total} notificaç{total !== 1 ? 'ões' : 'ão'}</span>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tipo</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Agendamento</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                <div className="flex items-center gap-1"><Clock size={12} /> Enviar em</div>
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tentativas</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && [...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(7)].map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                ))}
              </tr>
            ))}

            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Nenhuma notificação encontrada
                </td>
              </tr>
            )}

            {!isLoading && items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <NotificationTypeBadge type={item.type} />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.clients?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{item.clients?.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{item.appointments?.services?.name ?? '—'}</p>
                  {item.appointments?.scheduled_at && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.appointments.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                  {format(new Date(item.send_at), "dd/MM HH:mm", { locale: ptBR })}
                </td>
                <td className="px-4 py-3">
                  <NotificationStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">
                  {item.attempts}
                </td>
                <td className="px-4 py-3">
                  {item.status === 'pending' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          title="Cancelar notificação"
                        >
                          <XCircle size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar notificação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A notificação não será enviada ao cliente. Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Voltar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancel.mutate(item.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Cancelar notificação
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
          <span className="text-muted-foreground">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## PASSO 5 — CRIAR `src/features/notifications/components/LogTab.tsx`

```tsx
import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationTypeBadge, DeliveryStatusBadge } from './NotificationTypeBadge'
import { useNotificationLog } from '../hooks/useNotifications'

const PAGE_SIZE = 15

export function LogTab() {
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useNotificationLog({ page, pageSize: PAGE_SIZE })
  const items = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{total} registro{total !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-8 px-4 py-3" />
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tipo</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Agendamento</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Canal</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Enviada em</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Entrega</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && [...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(7)].map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                ))}
              </tr>
            ))}

            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Nenhum registro de envio encontrado
                </td>
              </tr>
            )}

            {!isLoading && items.map((item) => (
              <>
                <tr
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {expandedId === item.id
                      ? <ChevronDown size={14} />
                      : <ChevronRight size={14} />
                    }
                  </td>
                  <td className="px-4 py-3">
                    {/* Busca o tipo da queue pelo queue_id — exibe canal como fallback */}
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">{item.channel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.appointments?.clients?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{item.appointments?.clients?.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{item.appointments?.services?.name ?? '—'}</p>
                    {item.appointments?.scheduled_at && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.appointments.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{item.channel}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                    {format(new Date(item.sent_at), "dd/MM HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <DeliveryStatusBadge status={item.delivery_status} />
                  </td>
                </tr>

                {/* Linha expandida — mostra o corpo da mensagem */}
                {expandedId === item.id && (
                  <tr key={`${item.id}-expanded`} className="bg-muted/20">
                    <td colSpan={7} className="px-8 py-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Mensagem enviada:</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-white border rounded-lg px-3 py-2">
                        {item.message_body}
                      </p>
                      {item.error_message && (
                        <p className="text-xs text-destructive mt-2">
                          Erro: {item.error_message}
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## PASSO 6 — CRIAR `src/features/notifications/pages/NotificationsPage.tsx`

```tsx
import { Bell, Clock, CheckCircle, XCircle } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { QueueTab } from '../components/QueueTab'
import { LogTab } from '../components/LogTab'
import { useNotificationMetrics } from '../hooks/useNotifications'

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: 'amber' | 'green' | 'red'
  loading?: boolean
}) {
  const colorMap = {
    amber: { bg: 'bg-amber-50', icon: 'text-amber-500' },
    green: { bg: 'bg-green-50', icon: 'text-green-600' },
    red:   { bg: 'bg-red-50',   icon: 'text-red-500' },
  }
  const colors = colorMap[color]

  return (
    <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
        <Icon size={18} className={colors.icon} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading
          ? <Skeleton className="h-6 w-12 mt-0.5" />
          : <p className="text-xl font-semibold text-foreground leading-tight">{value}</p>
        }
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { data: metrics, isLoading } = useNotificationMetrics()

  return (
    <PageWrapper
      title="Notificações"
      description="Fila de envio e histórico de notificações WhatsApp"
    >
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Pendentes"
          value={metrics?.pending ?? 0}
          icon={Clock}
          color="amber"
          loading={isLoading}
        />
        <MetricCard
          label="Enviadas"
          value={metrics?.sent ?? 0}
          icon={CheckCircle}
          color="green"
          loading={isLoading}
        />
        <MetricCard
          label="Falharam"
          value={metrics?.failed ?? 0}
          icon={XCircle}
          color="red"
          loading={isLoading}
        />
      </div>

      {/* Abas Fila / Histórico */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="h-9">
          <TabsTrigger value="queue" className="gap-1.5 text-xs">
            <Clock size={14} />
            Fila de envio
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-1.5 text-xs">
            <Bell size={14} />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <QueueTab />
        </TabsContent>

        <TabsContent value="log">
          <LogTab />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}
```

---

## PASSO 7 — ATUALIZAR `src/features/notifications/index.ts`

```ts
export { default as NotificationsPage } from './pages/NotificationsPage'
```

---

## VERIFICAÇÃO FINAL

- [ ] `/notifications` renderiza sem erros
- [ ] 3 cards de métricas aparecem (valores 0 com banco vazio é esperado)
- [ ] Aba "Fila de envio" carrega com filtros de status e tipo funcionando
- [ ] Aba "Histórico" carrega com paginação
- [ ] Clicar em uma linha do histórico expande e mostra o corpo da mensagem
- [ ] Botão de cancelar notificação abre AlertDialog de confirmação
- [ ] Estado vazio em ambas as abas exibe mensagem correta
- [ ] Atualização automática da fila a cada 30s
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem warnings
