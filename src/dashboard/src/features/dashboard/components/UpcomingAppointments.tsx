import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpcomingAppointments } from '../hooks/useDashboard'
import { cn } from '@/lib/utils'
import type { UpcomingAppointment } from '@/services/dashboard.service'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending:   { label: 'Pendente',   variant: 'secondary' },
  confirmed: { label: 'Confirmado', variant: 'default' },
}

export function UpcomingAppointments() {
  const { data: appointments, isLoading } = useUpcomingAppointments()
  const apptList = (appointments ?? []) as UpcomingAppointment[]

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={16} className="text-muted-foreground" />
        <h2 className="text-sm font-medium text-foreground">Próximos agendamentos</h2>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && apptList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CalendarDays size={32} className="text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje</p>
        </div>
      )}

      {!isLoading && apptList.length > 0 && (
        <div className="space-y-2">
          {apptList.map((appt) => {
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
