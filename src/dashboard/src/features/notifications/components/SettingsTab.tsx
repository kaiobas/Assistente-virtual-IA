import { useState } from 'react'
import type { ElementType } from 'react'
import {
  Bell, BellOff, Clock, CheckCircle2,
  AlertCircle, CalendarCheck, CalendarX, Info,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useNotificationSettings, useUpdateNotificationSetting } from '../hooks/useNotifications'
import type { NotificationSetting } from '@/services/notifications.service'

const TYPE_META: Record<string, {
  label: string
  description: string
  icon: ElementType
  iconColor: string
  hasAdvance: boolean
  advanceLabel?: string
}> = {
  booking_created: {
    label: 'Agendamento criado',
    description: 'Enviada ao cliente assim que um novo agendamento é registrado via WhatsApp.',
    icon: CalendarCheck,
    iconColor: 'text-blue-500',
    hasAdvance: false,
  },
  booking_confirmed: {
    label: 'Agendamento confirmado',
    description: 'Enviada quando o agendamento é confirmado pelo dono ou pelo próprio cliente.',
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    hasAdvance: false,
  },
  confirmation_request: {
    label: 'Solicitação de confirmação',
    description: 'Pergunta ao cliente se ele confirma o agendamento. Enviada X horas antes.',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    hasAdvance: true,
    advanceLabel: 'Enviar com quantas horas de antecedência?',
  },
  reminder_d1: {
    label: 'Lembrete (D-1)',
    description: 'Lembrete enviado X horas antes do agendamento.',
    icon: Clock,
    iconColor: 'text-blue-500',
    hasAdvance: true,
    advanceLabel: 'Enviar com quantas horas de antecedência?',
  },
  reminder_h2: {
    label: 'Lembrete (2h antes)',
    description: 'Lembrete próximo ao horário. Enviado X horas antes do agendamento.',
    icon: Bell,
    iconColor: 'text-blue-400',
    hasAdvance: true,
    advanceLabel: 'Enviar com quantas horas de antecedência?',
  },
  cancellation_notice: {
    label: 'Aviso de cancelamento',
    description: 'Enviada ao cliente quando um agendamento é cancelado.',
    icon: CalendarX,
    iconColor: 'text-red-500',
    hasAdvance: false,
  },
}

const TYPE_ORDER = [
  'booking_created',
  'booking_confirmed',
  'confirmation_request',
  'reminder_d1',
  'reminder_h2',
  'cancellation_notice',
]

function NotificationSettingCard({ setting }: { setting: NotificationSetting }) {
  const meta = TYPE_META[setting.type]
  const update = useUpdateNotificationSetting()
  const [advanceValue, setAdvanceValue] = useState(String(setting.advance_hours))

  if (!meta) return null

  const Icon = meta.icon

  function handleToggle(enabled: boolean) {
    void update.mutateAsync({ id: setting.id, payload: { enabled } })
  }

  function handleAdvanceBlur() {
    const parsed = parseInt(advanceValue, 10)
    if (isNaN(parsed) || parsed < 0) {
      setAdvanceValue(String(setting.advance_hours))
      return
    }
    if (parsed === setting.advance_hours) return
    void update.mutateAsync({ id: setting.id, payload: { advance_hours: parsed } })
  }

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border p-5 transition-opacity',
        !setting.enabled && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            setting.enabled ? 'bg-muted' : 'bg-muted/50',
          )}>
            <Icon size={18} className={setting.enabled ? meta.iconColor : 'text-muted-foreground'} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{meta.label}</p>
              {!setting.enabled && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BellOff size={11} />
                  Desativada
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {meta.description}
            </p>

            {meta.hasAdvance && setting.enabled && (
              <div className="flex items-center gap-2 mt-3">
                <Clock size={13} className="text-muted-foreground flex-shrink-0" />
                <label className="text-xs text-muted-foreground flex-shrink-0">
                  {meta.advanceLabel}
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={168}
                    value={advanceValue}
                    onChange={(e) => setAdvanceValue(e.target.value)}
                    onBlur={handleAdvanceBlur}
                    className="h-7 w-20 text-sm text-center"
                    disabled={update.isPending}
                  />
                  <span className="text-xs text-muted-foreground">horas</span>
                </div>
              </div>
            )}

            {!meta.hasAdvance && setting.enabled && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Info size={12} />
                <span>Enviada imediatamente após o evento</span>
              </div>
            )}
          </div>
        </div>

        <Switch
          checked={setting.enabled}
          onCheckedChange={handleToggle}
          disabled={update.isPending}
          className="flex-shrink-0 mt-0.5"
        />
      </div>
    </div>
  )
}

export function SettingsTab() {
  const { data: settings, isLoading } = useNotificationSettings()

  const sorted = TYPE_ORDER
    .map((type) => settings?.find((s) => s.type === type))
    .filter((s): s is NotificationSetting => s !== undefined)

  const activeCount = settings?.filter((s) => s.enabled).length ?? 0
  const totalCount = settings?.length ?? 0

  return (
    <div className="space-y-5 max-w-2xl">
      {!isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell size={14} />
          <span>{activeCount} de {totalCount} notificações ativas</span>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BellOff size={32} className="text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma configuração encontrada</p>
        </div>
      )}

      {!isLoading && sorted.map((setting) => (
        <NotificationSettingCard key={setting.id} setting={setting} />
      ))}

      {!isLoading && sorted.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <p>
            As alterações entram em vigor nas próximas notificações criadas pelo assistente.
            Notificações já agendadas na fila não são afetadas.
          </p>
        </div>
      )}
    </div>
  )
}
