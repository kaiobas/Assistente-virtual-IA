# Prompt: Aba Configurações na tela de Notificações

> Cole no GitHub Copilot Chat (modo Agent).
> Branch: kaio — a tela de Notificações já existe com as abas Fila e Histórico.
> Este prompt adiciona a terceira aba: Configurações.

---

## CONTEXTO

O dono pode configurar, para cada tipo de notificação:
- **Toggle** — ativar ou desativar o envio
- **Antecedência** — quantas horas antes do agendamento a notificação é enviada

Essas configurações são lidas pelo n8n toda vez que ele cria uma entrada na
`notification_queue`. Se `enabled = false`, o n8n não agenda aquele tipo.

---

## BANCO DE DADOS

```
notification_settings:
  id, business_id,
  type (text): booking_created | booking_confirmed | confirmation_request |
               reminder_d1 | reminder_h2 | cancellation_notice
  enabled (boolean)
  advance_hours (integer) — 0 = imediato, 24 = 1 dia antes, 2 = 2h antes
  created_at, updated_at

Dados atuais no banco:
  booking_confirmed    → enabled: true, advance_hours: 0
  booking_created      → enabled: true, advance_hours: 0
  cancellation_notice  → enabled: true, advance_hours: 0
  confirmation_request → enabled: true, advance_hours: 24
  reminder_d1          → enabled: true, advance_hours: 24
  reminder_h2          → enabled: true, advance_hours: 2
```

---

## PASSO 1 — ADICIONAR AO SERVICE `src/services/notifications.service.ts`

Adicione as seguintes funções ao arquivo existente (não recriar o arquivo inteiro):

```ts
// --- Configurações de notificação ---

export interface NotificationSetting {
  id: string
  type: string
  enabled: boolean
  advance_hours: number
}

export async function getNotificationSettings(): Promise<NotificationSetting[]> {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('id, type, enabled, advance_hours')
    .order('type')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updateNotificationSetting(
  id: string,
  payload: { enabled?: boolean; advance_hours?: number }
) {
  const { data, error } = await supabase
    .from('notification_settings')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
```

---

## PASSO 2 — ADICIONAR AO HOOK `src/features/notifications/hooks/useNotifications.ts`

Adicione ao arquivo existente:

```ts
import {
  // imports já existentes...
  getNotificationSettings,
  updateNotificationSetting,
  type NotificationSetting,  // adicionar ao import
} from '@/services/notifications.service'

export function useNotificationSettings() {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, 'settings'],
    queryFn: getNotificationSettings,
  })
}

export function useUpdateNotificationSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: { enabled?: boolean; advance_hours?: number }
    }) => updateNotificationSetting(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS, 'settings'] })
    },
  })
}
```

---

## PASSO 3 — CRIAR `src/features/notifications/components/SettingsTab.tsx`

```tsx
import { useState } from 'react'
import {
  Bell, BellOff, Clock, CheckCircle2, XCircle,
  AlertCircle, CalendarCheck, CalendarX, Info,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useNotificationSettings, useUpdateNotificationSetting } from '../hooks/useNotifications'

// Metadados de exibição para cada tipo de notificação
const TYPE_META: Record<string, {
  label: string
  description: string
  icon: React.ElementType
  iconColor: string
  // Se true, o campo de antecedência faz sentido para esse tipo
  hasAdvance: boolean
  // Texto de ajuda para o campo de antecedência
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

// Ordem de exibição dos tipos
const TYPE_ORDER = [
  'booking_created',
  'booking_confirmed',
  'confirmation_request',
  'reminder_d1',
  'reminder_h2',
  'cancellation_notice',
]

// Card de configuração de um tipo de notificação
function NotificationSettingCard({
  setting,
}: {
  setting: {
    id: string
    type: string
    enabled: boolean
    advance_hours: number
  }
}) {
  const meta = TYPE_META[setting.type]
  const update = useUpdateNotificationSetting()
  const [advanceValue, setAdvanceValue] = useState(String(setting.advance_hours))

  if (!meta) return null

  const Icon = meta.icon

  async function handleToggle(enabled: boolean) {
    await update.mutateAsync({ id: setting.id, payload: { enabled } })
  }

  async function handleAdvanceBlur() {
    const parsed = parseInt(advanceValue, 10)
    if (isNaN(parsed) || parsed < 0) {
      setAdvanceValue(String(setting.advance_hours))
      return
    }
    if (parsed === setting.advance_hours) return
    await update.mutateAsync({ id: setting.id, payload: { advance_hours: parsed } })
  }

  return (
    <div className={cn(
      'bg-white rounded-xl border border-border p-5 transition-opacity',
      !setting.enabled && 'opacity-60'
    )}>
      <div className="flex items-start justify-between gap-4">
        {/* Ícone + info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            setting.enabled ? 'bg-muted' : 'bg-muted/50'
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

            {/* Campo de antecedência — só aparece se o tipo suportar */}
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

            {/* Info: tipos imediatos */}
            {!meta.hasAdvance && setting.enabled && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Info size={12} />
                <span>Enviada imediatamente após o evento</span>
              </div>
            )}
          </div>
        </div>

        {/* Toggle */}
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

  // Ordena conforme TYPE_ORDER
  const sorted = TYPE_ORDER
    .map((type) => settings?.find((s) => s.type === type))
    .filter(Boolean) as NonNullable<typeof settings>

  const activeCount = settings?.filter((s) => s.enabled).length ?? 0
  const totalCount = settings?.length ?? 0

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Resumo */}
      {!isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell size={14} />
          <span>
            {activeCount} de {totalCount} notificações ativas
          </span>
        </div>
      )}

      {/* Cards de loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Cards de configuração */}
      {!isLoading && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BellOff size={32} className="text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma configuração encontrada
          </p>
        </div>
      )}

      {!isLoading && sorted.map((setting) => (
        <NotificationSettingCard key={setting.id} setting={setting} />
      ))}

      {/* Aviso sobre o n8n */}
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
```

---

## PASSO 4 — ATUALIZAR `src/features/notifications/pages/NotificationsPage.tsx`

Adicione a terceira aba ao arquivo existente. Localize o bloco de `<Tabs>` e substitua por:

```tsx
// Adicionar import no topo do arquivo:
import { SettingsTab } from '../components/SettingsTab'
import { Settings } from 'lucide-react' // adicionar ao import do lucide

// Substituir o bloco <Tabs> existente por:
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
```

---

## VERIFICAÇÃO FINAL

- [ ] Aba "Configurações" aparece na tela de Notificações
- [ ] 6 cards carregam com os dados do banco
- [ ] Toggle ativa/desativa cada notificação e persiste
- [ ] Campo de horas aparece apenas nos tipos: `confirmation_request`, `reminder_d1`, `reminder_h2`
- [ ] Alterar horas e sair do campo (blur) salva automaticamente
- [ ] Valor inválido no campo de horas reverte para o valor anterior
- [ ] Tipos sem antecedência mostram "Enviada imediatamente após o evento"
- [ ] Card fica com opacidade reduzida quando desativado
- [ ] Aviso sobre o n8n aparece no rodapé
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem warnings
