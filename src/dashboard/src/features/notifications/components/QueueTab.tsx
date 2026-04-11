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
] as const

const TYPE_OPTIONS = [
  { label: 'Todos os tipos',     value: 'all' },
  { label: 'Lembrete D-1',      value: 'reminder_d1' },
  { label: 'Lembrete 2h',       value: 'reminder_h2' },
  { label: 'Confirmação',       value: 'confirmation_request' },
  { label: 'Cancelamento',      value: 'cancellation_notice' },
  { label: 'Agend. confirmado', value: 'booking_confirmed' },
  { label: 'Agend. criado',     value: 'booking_created' },
] as const

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
        <Select
          value={status}
          onValueChange={(v) => { if (v) { setStatus(v); setPage(1) } }}
        >
          <SelectTrigger className="w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={type}
          onValueChange={(v) => { if (v) { setType(v); setPage(1) } }}
        >
          <SelectTrigger className="w-48 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 ml-auto"
          onClick={() => { void refetch() }}
          title="Atualizar"
        >
          <RefreshCw size={15} />
        </Button>

        <span className="text-sm text-muted-foreground">
          {total} notificaç{total !== 1 ? 'ões' : 'ão'}
        </span>
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
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
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
                  {format(new Date(item.send_at), 'dd/MM HH:mm', { locale: ptBR })}
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
                      <AlertDialogTrigger
                        render={
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            title="Cancelar notificação"
                          >
                            <XCircle size={14} />
                          </Button>
                        }
                      />
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
