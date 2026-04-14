import { Badge } from '@/components/ui/badge'
import type { AppointmentStatus } from '@/services/appointments.service'

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  pending:               { label: 'Pendente',             className: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed:             { label: 'Confirmado',           className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:             { label: 'Concluído',            className: 'bg-green-50 text-green-700 border-green-200' },
  no_show:               { label: 'Não compareceu',       className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled_by_client:   { label: 'Cancelado (cliente)',  className: 'bg-red-50 text-red-700 border-red-200' },
  cancelled_by_business: { label: 'Cancelado (negócio)', className: 'bg-red-50 text-red-700 border-red-200' },
  cancelled_auto:        { label: 'Cancelado (auto)',     className: 'bg-red-50 text-red-700 border-red-200' },
}

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: '' }
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
