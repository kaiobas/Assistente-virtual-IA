import { useState, useMemo } from 'react'
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppointmentsByDateRange } from '../hooks/useAppointments'
import type { CalendarAppointment } from '@/services/appointments.service'

// Horas exibidas no calendário (08h às 20h)
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)

export function AppointmentsCalendar() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const { data: appointments, isLoading } = useAppointmentsByDateRange(
    weekStart.toISOString(),
    weekEnd.toISOString()
  )

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>()
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd')
      map.set(
        key,
        (appointments ?? []).filter((a) => isSameDay(new Date(a.scheduled_at), day))
      )
    }
    return map
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [appointments, days])

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Navegação da semana */}
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setWeekStart((w) => subWeeks(w, 1))}
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="text-sm font-medium">
          {format(weekStart, "d 'de' MMMM", { locale: ptBR })} —{' '}
          {format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setWeekStart((w) => addWeeks(w, 1))}
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Header dos dias */}
      <div className="grid grid-cols-8 border-b">
        <div className="py-2 px-3 text-xs text-muted-foreground" />
        {days.map((day) => (
          <div key={day.toISOString()} className="py-2 px-2 text-center border-l">
            <p className="text-xs text-muted-foreground uppercase">
              {format(day, 'EEE', { locale: ptBR })}
            </p>
            <p
              className={`text-sm font-medium mt-0.5 ${
                isSameDay(day, new Date()) ? 'text-primary' : ''
              }`}
            >
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Grade de horários */}
      <div className="overflow-y-auto max-h-[520px]">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          HOURS.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 border-b last:border-0 min-h-[56px]"
            >
              <div className="px-3 py-2 text-xs text-muted-foreground flex-shrink-0">
                {String(hour).padStart(2, '0')}:00
              </div>
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const dayAppts = byDay.get(key) ?? []
                const hourAppts = dayAppts.filter(
                  (a) => new Date(a.scheduled_at).getHours() === hour
                )

                return (
                  <div key={day.toISOString()} className="border-l px-1 py-1 space-y-1">
                    {hourAppts.map((appt) => (
                      <div
                        key={appt.id}
                        className="bg-blue-50 border border-blue-200 rounded px-1.5 py-1 text-xs cursor-pointer hover:bg-blue-100 transition-colors"
                      >
                        <p className="font-medium text-blue-800 truncate">
                          {format(new Date(appt.scheduled_at), 'HH:mm')}{' '}
                          {appt.clients?.name ?? 'Cliente'}
                        </p>
                        <p className="text-blue-600 truncate">{appt.services?.name}</p>
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
