import { CalendarDays, CheckCircle, Clock, Users, MessageSquare } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { MetricCard } from '../components/MetricCard'
import { AppointmentsChart } from '../components/AppointmentsChart'
import { UpcomingAppointments } from '../components/UpcomingAppointments'
import { useDayMetrics } from '../hooks/useDashboard'
import { useBusiness } from '@/features/settings/hooks/useSettings'
import { useAuthStore } from '@/store/auth.store'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getFirstName(email: string) {
  const local = email.split('@')[0] ?? ''
  const name = local.split(/[._\-+]/)[0] ?? local
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDayMetrics()
  const { data: business } = useBusiness()
  const { user } = useAuthStore()

  const greeting = getGreeting()
  const name = business?.owner_name?.trim() ||
    (user?.email ? getFirstName(user.email) : null)

  return (
    <PageWrapper
      title={
        <span>
          {greeting}{name ? (
            <>, <span className="text-foreground">{name}</span></>
          ) : null} 👋
        </span>
      }
      description="Aqui está o resumo do seu dia"
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
