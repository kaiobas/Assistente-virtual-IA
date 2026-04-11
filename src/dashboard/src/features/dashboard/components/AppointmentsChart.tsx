import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
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
