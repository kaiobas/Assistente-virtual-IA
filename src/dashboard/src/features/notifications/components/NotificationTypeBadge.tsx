import { Badge } from '@/components/ui/badge'

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  reminder_d1:          { label: 'Lembrete D-1',      className: 'bg-blue-50 text-blue-700 border-blue-200' },
  reminder_h2:          { label: 'Lembrete 2h',       className: 'bg-blue-50 text-blue-700 border-blue-200' },
  confirmation_request: { label: 'Confirmação',       className: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancellation_notice:  { label: 'Cancelamento',      className: 'bg-red-50 text-red-700 border-red-200' },
  booking_confirmed:    { label: 'Agend. confirmado', className: 'bg-green-50 text-green-700 border-green-200' },
  booking_created:      { label: 'Agend. criado',     className: 'bg-green-50 text-green-700 border-green-200' },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pendente',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
  sent:      { label: 'Enviada',    className: 'bg-green-50 text-green-700 border-green-200' },
  failed:    { label: 'Falhou',     className: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelada', className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

const DELIVERY_CONFIG: Record<string, { label: string; className: string }> = {
  delivered: { label: 'Entregue',     className: 'bg-green-50 text-green-700 border-green-200' },
  read:      { label: 'Lida',         className: 'bg-blue-50 text-blue-700 border-blue-200' },
  failed:    { label: 'Falhou',       className: 'bg-red-50 text-red-700 border-red-200' },
  unknown:   { label: 'Desconhecido', className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export function NotificationTypeBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] ?? { label: type, className: '' }
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  )
}

export function NotificationStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: '' }
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  )
}

export function DeliveryStatusBadge({ status }: { status: string }) {
  const config = DELIVERY_CONFIG[status] ?? { label: status, className: '' }
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  )
}
