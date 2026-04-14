import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Phone,
  Mail,
  Bot,
  BotOff,
  Shield,
  Edit2,
  Check,
  X,
  MessageSquare,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { AppointmentStatusBadge } from '@/features/appointments/components/AppointmentStatusBadge'
import {
  useClientAppointments,
  useClientConversations,
  useUpdateClient,
} from '../hooks/useClients'
import type { ClientRow, ClientAppointmentRow, ClientConversationRow } from '@/services/clients.service'
import type { IaStatus } from '@/services/clients.service'

interface ClientDetailPanelProps {
  client: ClientRow
}

const CONV_STATUS_LABEL: Record<ClientConversationRow['status'], string> = {
  active: 'Ativa',
  human_takeover: 'Humano',
  closed: 'Encerrada',
}

const CONV_STATUS_COLOR: Record<ClientConversationRow['status'], string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  human_takeover: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function ClientDetailPanel({ client }: ClientDetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(client.name ?? '')
  const [editEmail, setEditEmail] = useState(client.email ?? '')
  const [editNotes, setEditNotes] = useState(client.notes ?? '')

  const { data: appointments, isLoading: loadingAppts } = useClientAppointments(client.id)
  const { data: conversations, isLoading: loadingConvs } = useClientConversations(client.id)
  const updateMutation = useUpdateClient()

  function handleSave() {
    void updateMutation
      .mutateAsync({ id: client.id, payload: { name: editName, email: editEmail, notes: editNotes } })
      .then(() => setEditing(false))
  }

  function handleIaToggle(checked: boolean) {
    const newStatus: IaStatus = checked ? 'active' : 'human_takeover'
    void updateMutation.mutateAsync({ id: client.id, payload: { ia_status: newStatus } })
  }

  const displayName = client.name ?? client.phone
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header do cliente */}
      <div className="p-5 border-b">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-semibold text-primary">{initials}</span>
          </div>

          {/* Nome */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-sm font-medium mb-1"
                placeholder="Nome do cliente"
              />
            ) : (
              <p className="text-base font-semibold text-foreground">
                {client.name ?? 'Sem nome'}
              </p>
            )}
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone size={12} /> {client.phone}
            </p>
          </div>

          {/* Botões editar/salvar */}
          {editing ? (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setEditing(false)}
              >
                <X size={14} />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Check size={14} />
              </Button>
            </div>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setEditing(true)}
            >
              <Edit2 size={14} />
            </Button>
          )}
        </div>

        {/* Email */}
        <div className="mt-3 space-y-2">
          {editing ? (
            <Input
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="Email (opcional)"
              className="h-8 text-sm"
            />
          ) : client.email ? (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Mail size={12} /> {client.email}
            </p>
          ) : null}
        </div>

        {/* Toggle IA */}
        <div className="flex items-center justify-between mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {client.ia_status === 'active' ? (
              <Bot size={15} className="text-green-600" />
            ) : (
              <BotOff size={15} className="text-amber-500" />
            )}
            <div>
              <p className="text-sm font-medium">Assistente IA</p>
              <p className="text-xs text-muted-foreground">
                {client.ia_status === 'active'
                  ? 'Respondendo automaticamente'
                  : 'Atendimento manual ativo'}
              </p>
            </div>
          </div>
          <Switch
            checked={client.ia_status === 'active'}
            onCheckedChange={handleIaToggle}
            disabled={updateMutation.isPending || client.ia_status === 'blocked'}
          />
        </div>

        {/* Badge bloqueado */}
        {client.ia_status === 'blocked' && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-md">
            <Shield size={12} /> Cliente bloqueado — contate o suporte para desbloquear
          </div>
        )}
      </div>

      {/* Notas */}
      <div className="p-5 border-b">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Notas internas
        </p>
        {editing ? (
          <Textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Anotações sobre o cliente..."
            rows={3}
            className="text-sm"
          />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {client.notes ? (
              client.notes
            ) : (
              <span className="text-muted-foreground italic">Sem notas</span>
            )}
          </p>
        )}
      </div>

      {/* Histórico de agendamentos */}
      <div className="p-5 border-b">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={14} className="text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Agendamentos
          </p>
        </div>

        {loadingAppts && <Skeleton className="h-16 w-full rounded-lg" />}

        {!loadingAppts && (!appointments || appointments.length === 0) && (
          <p className="text-sm text-muted-foreground italic">Nenhum agendamento</p>
        )}

        {!loadingAppts && appointments && appointments.length > 0 && (
          <div className="space-y-2">
            {appointments.map((appt: ClientAppointmentRow) => (
              <div
                key={appt.id}
                className="flex items-center justify-between text-sm border rounded-lg px-3 py-2"
              >
                <div>
                  <p className="font-medium">{appt.services?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(appt.scheduled_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                    {appt.professionals?.display_name
                      ? ` · ${appt.professionals.display_name}`
                      : ''}
                  </p>
                </div>
                <AppointmentStatusBadge status={appt.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de conversas */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={14} className="text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Conversas
          </p>
        </div>

        {loadingConvs && <Skeleton className="h-16 w-full rounded-lg" />}

        {!loadingConvs && (!conversations || conversations.length === 0) && (
          <p className="text-sm text-muted-foreground italic">Nenhuma conversa</p>
        )}

        {!loadingConvs && conversations && conversations.length > 0 && (
          <div className="space-y-2">
            {conversations.map((conv: ClientConversationRow) => (
              <div
                key={conv.id}
                className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-xs text-muted-foreground">
                    Iniciada{' '}
                    {format(new Date(conv.started_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                  {conv.context_summary && (
                    <p className="text-xs text-foreground mt-0.5 line-clamp-1">
                      {conv.context_summary}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={CONV_STATUS_COLOR[conv.status]}
                >
                  {CONV_STATUS_LABEL[conv.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
