import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle, XCircle, AlertCircle, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { useAppointments, useUpdateAppointmentStatus } from '../hooks/useAppointments'
import type { AppointmentStatus } from '@/services/appointments.service'

const STATUS_FILTER_OPTIONS = [
  { label: 'Todos os status',  value: 'all' },
  { label: 'Pendentes',        value: 'pending' },
  { label: 'Confirmados',      value: 'confirmed' },
  { label: 'Concluídos',       value: 'completed' },
  { label: 'Cancelados',       value: 'cancelled_by_business' },
  { label: 'Não compareceu',   value: 'no_show' },
]

const PAGE_SIZE = 15

export function AppointmentsList() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

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
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            if (v !== null) {
              setStatusFilter(v)
              setPage(1)
            }
          }}
        >
          <SelectTrigger className="w-48 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {total} agendamento{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                Data e hora
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                Cliente
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                Profissional
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                Serviço
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                Origem
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && appointments.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  Nenhum agendamento encontrado
                </td>
              </tr>
            )}

            {!isLoading &&
              appointments.map((appt) => (
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
                    <p className="text-xs text-muted-foreground">
                      {appt.services?.duration_min}min
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <AppointmentStatusBadge status={appt.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                    {appt.source === 'whatsapp' ? '📱 WhatsApp' : '🖥️ Dashboard'}
                  </td>
                  <td className="px-4 py-3">
                    {['pending', 'confirmed'].includes(appt.status) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal size={14} />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            {appt.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => handleAction(appt.id, 'confirmed')}
                              >
                                <CheckCircle
                                  size={14}
                                  className="mr-2 text-green-600"
                                />
                                Confirmar
                              </DropdownMenuItem>
                            )}
                            {appt.status === 'confirmed' && (
                              <DropdownMenuItem
                                onClick={() => handleAction(appt.id, 'completed')}
                              >
                                <CheckCircle
                                  size={14}
                                  className="mr-2 text-blue-600"
                                />
                                Marcar concluído
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleAction(appt.id, 'no_show')}
                            >
                              <AlertCircle
                                size={14}
                                className="mr-2 text-gray-500"
                              />
                              Não compareceu
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                handleAction(appt.id, 'cancelled_by_business')
                              }
                            >
                              <XCircle size={14} className="mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
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
