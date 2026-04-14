import { Bell, Clock, CheckCircle, XCircle, Settings } from 'lucide-react'
import type { ElementType } from 'react'
import { PageWrapper } from '@/components/layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { QueueTab } from '../components/QueueTab'
import { LogTab } from '../components/LogTab'
import { SettingsTab } from '../components/SettingsTab'
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
  icon: ElementType
  color: 'amber' | 'green' | 'red'
  loading?: boolean
}) {
  const colorMap = {
    amber: { bg: 'bg-amber-50', icon: 'text-amber-500' },
    green: { bg: 'bg-green-50', icon: 'text-green-600' },
    red:   { bg: 'bg-red-50',   icon: 'text-red-500' },
  } as const
  const colors = colorMap[color]

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
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

      {/* Abas Fila / Histórico / Configurações */}
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
          <TabsTrigger value="settings" className="gap-1.5 text-xs">
            <Settings size={14} />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <QueueTab />
        </TabsContent>

        <TabsContent value="log">
          <LogTab />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}
