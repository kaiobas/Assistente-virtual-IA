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
