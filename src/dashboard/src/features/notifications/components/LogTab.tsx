import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DeliveryStatusBadge } from './NotificationTypeBadge'
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
        <span className="text-sm text-muted-foreground">
          {total} registro{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-8 px-4 py-3" />
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Canal</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Agendamento</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Enviada em</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Entrega</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                ))}
              </tr>
            ))}

            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
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
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                    {format(new Date(item.sent_at), 'dd/MM HH:mm', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <DeliveryStatusBadge status={item.delivery_status} />
                  </td>
                </tr>

                {expandedId === item.id && (
                  <tr key={`${item.id}-expanded`} className="bg-muted/20">
                    <td colSpan={6} className="px-8 py-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Mensagem enviada:</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-muted border rounded-lg px-3 py-2">
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
