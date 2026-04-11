# Prompt: Tela Clientes

> Cole no GitHub Copilot Chat (modo Agent).
> Layout base, Overview e Agendamentos já estão prontos.

---

## CONTEXTO

A tela de clientes tem layout split-panel:
- **Esquerda:** lista de clientes com busca e filtro por status da IA
- **Direita:** painel de detalhes do cliente selecionado com histórico de agendamentos, conversas e edição inline

---

## BANCO DE DADOS — TABELAS RELEVANTES

```
clients:
  id, business_id, name, phone, email, notes,
  ia_status (active | human_takeover | blocked),
  first_contact_at, last_contact_at, created_at, updated_at

appointments:
  id, client_id, scheduled_at, ends_at, status
  → joins: professionals(display_name), services(name, duration_min, price)

conversation_sessions:
  id, client_id, status (active | human_takeover | closed),
  started_at, last_message_at
```

---

## PASSO 1 — INSTALAR COMPONENTES shadcn/ui

```bash
npx shadcn@latest add switch
npx shadcn@latest add form
```

---

## PASSO 2 — CRIAR SERVICE `src/services/clients.service.ts`

```ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type IaStatus = Database['public']['Enums']['ia_status_enum']

export interface ClientRow {
  id: string
  name: string | null
  phone: string
  email: string | null
  notes: string | null
  ia_status: IaStatus
  first_contact_at: string
  last_contact_at: string
  created_at: string
}

export interface ClientFilters {
  search?: string
  ia_status?: IaStatus | 'all'
  page?: number
  pageSize?: number
}

// Lista de clientes com busca e filtro
export async function getClients(filters: ClientFilters = {}) {
  const { search, ia_status, page = 1, pageSize = 30 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('clients')
    .select('id, name, phone, email, notes, ia_status, first_contact_at, last_contact_at, created_at', {
      count: 'exact',
    })
    .order('last_contact_at', { ascending: false })
    .range(from, to)

  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  if (ia_status && ia_status !== 'all') query = query.eq('ia_status', ia_status)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as ClientRow[], count: count ?? 0 }
}

// Busca agendamentos do cliente
export async function getClientAppointments(clientId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, scheduled_at, ends_at, status, source,
      professionals(display_name),
      services(name, duration_min, price)
    `)
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: false })
    .limit(10)

  if (error) throw new Error(error.message)
  return data ?? []
}

// Busca sessões de conversa do cliente
export async function getClientConversations(clientId: string) {
  const { data, error } = await supabase
    .from('conversation_sessions')
    .select('id, status, started_at, last_message_at, context_summary')
    .eq('client_id', clientId)
    .order('last_message_at', { ascending: false })
    .limit(5)

  if (error) throw new Error(error.message)
  return data ?? []
}

export interface UpdateClientPayload {
  name?: string
  email?: string
  notes?: string
  ia_status?: IaStatus
}

// Atualiza dados do cliente
export async function updateClient(id: string, payload: UpdateClientPayload) {
  const { data, error } = await supabase
    .from('clients')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
```

---

## PASSO 3 — CRIAR HOOKS `src/features/clients/hooks/useClients.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getClients,
  getClientAppointments,
  getClientConversations,
  updateClient,
  type ClientFilters,
  type UpdateClientPayload,
} from '@/services/clients.service'

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENTS, filters],
    queryFn: () => getClients(filters),
  })
}

export function useClientAppointments(clientId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENTS, clientId, 'appointments'],
    queryFn: () => getClientAppointments(clientId!),
    enabled: !!clientId,
  })
}

export function useClientConversations(clientId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENTS, clientId, 'conversations'],
    queryFn: () => getClientConversations(clientId!),
    enabled: !!clientId,
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClientPayload }) =>
      updateClient(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
    },
  })
}
```

---

## PASSO 4 — CRIAR `src/features/clients/components/ClientListItem.tsx`

```tsx
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { ClientRow } from '@/services/clients.service'

// Badge de status da IA
const IA_STATUS_CONFIG = {
  active:         { label: 'IA ativa',    dot: 'bg-green-500' },
  human_takeover: { label: 'Humano',      dot: 'bg-amber-500' },
  blocked:        { label: 'Bloqueado',   dot: 'bg-red-500' },
}

interface ClientListItemProps {
  client: ClientRow
  selected: boolean
  onClick: () => void
}

export function ClientListItem({ client, selected, onClick }: ClientListItemProps) {
  const status = IA_STATUS_CONFIG[client.ia_status]
  const initials = (client.name ?? client.phone)
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        'border-b border-border last:border-0',
        selected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'
      )}
    >
      {/* Avatar com iniciais */}
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-primary">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {client.name ?? 'Sem nome'}
        </p>
        <p className="text-xs text-muted-foreground truncate">{client.phone}</p>
      </div>

      {/* Status + tempo */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
          <span className="text-xs text-muted-foreground">{status.label}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(client.last_contact_at), { locale: ptBR, addSuffix: true })}
        </span>
      </div>
    </button>
  )
}
```

---

## PASSO 5 — CRIAR `src/features/clients/components/ClientDetailPanel.tsx`

```tsx
import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Phone, Mail, Bot, BotOff, Shield, Edit2, Check, X, MessageSquare, CalendarDays } from 'lucide-react'
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
import type { ClientRow } from '@/services/clients.service'
import type { Database } from '@/types/database.types'

type IaStatus = Database['public']['Enums']['ia_status_enum']

interface ClientDetailPanelProps {
  client: ClientRow
}

export function ClientDetailPanel({ client }: ClientDetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(client.name ?? '')
  const [editEmail, setEditEmail] = useState(client.email ?? '')
  const [editNotes, setEditNotes] = useState(client.notes ?? '')

  const { data: appointments, isLoading: loadingAppts } = useClientAppointments(client.id)
  const { data: conversations, isLoading: loadingConvs } = useClientConversations(client.id)
  const updateClient = useUpdateClient()

  // Salva edições
  async function handleSave() {
    await updateClient.mutateAsync({
      id: client.id,
      payload: { name: editName, email: editEmail, notes: editNotes },
    })
    setEditing(false)
  }

  // Toggle ia_status: active ↔ human_takeover
  async function handleIaToggle(checked: boolean) {
    const newStatus: IaStatus = checked ? 'active' : 'human_takeover'
    await updateClient.mutateAsync({ id: client.id, payload: { ia_status: newStatus } })
  }

  const initials = (client.name ?? client.phone)
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
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

          {/* Nome e ações */}
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
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(false)}>
                <X size={14} />
              </Button>
              <Button size="icon" className="h-8 w-8" onClick={handleSave} disabled={updateClient.isPending}>
                <Check size={14} />
              </Button>
            </div>
          ) : (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}>
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
            {client.ia_status === 'active'
              ? <Bot size={15} className="text-green-600" />
              : <BotOff size={15} className="text-amber-500" />
            }
            <div>
              <p className="text-sm font-medium">Assistente IA</p>
              <p className="text-xs text-muted-foreground">
                {client.ia_status === 'active' ? 'Respondendo automaticamente' : 'Atendimento manual ativo'}
              </p>
            </div>
          </div>
          <Switch
            checked={client.ia_status === 'active'}
            onCheckedChange={handleIaToggle}
            disabled={updateClient.isPending || client.ia_status === 'blocked'}
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
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Notas internas</p>
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
            {client.notes || <span className="text-muted-foreground italic">Sem notas</span>}
          </p>
        )}
      </div>

      {/* Histórico de agendamentos */}
      <div className="p-5 border-b">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={14} className="text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agendamentos</p>
        </div>

        {loadingAppts && <Skeleton className="h-16 w-full rounded-lg" />}

        {!loadingAppts && (!appointments || appointments.length === 0) && (
          <p className="text-sm text-muted-foreground italic">Nenhum agendamento</p>
        )}

        {!loadingAppts && appointments && appointments.length > 0 && (
          <div className="space-y-2">
            {appointments.map((appt: any) => (
              <div key={appt.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                <div>
                  <p className="font-medium">{appt.services?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(appt.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {' · '}{appt.professionals?.display_name}
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
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversas</p>
        </div>

        {loadingConvs && <Skeleton className="h-16 w-full rounded-lg" />}

        {!loadingConvs && (!conversations || conversations.length === 0) && (
          <p className="text-sm text-muted-foreground italic">Nenhuma conversa</p>
        )}

        {!loadingConvs && conversations && conversations.length > 0 && (
          <div className="space-y-2">
            {conversations.map((conv: any) => {
              const statusLabel = { active: 'Ativa', human_takeover: 'Humano', closed: 'Encerrada' }
              const statusColor = { active: 'bg-green-50 text-green-700 border-green-200', human_takeover: 'bg-amber-50 text-amber-700 border-amber-200', closed: 'bg-gray-100 text-gray-600 border-gray-200' }
              return (
                <div key={conv.id} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Iniciada {format(new Date(conv.started_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    {conv.context_summary && (
                      <p className="text-xs text-foreground mt-0.5 line-clamp-1">{conv.context_summary}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={statusColor[conv.status as keyof typeof statusColor]}>
                    {statusLabel[conv.status as keyof typeof statusLabel]}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## PASSO 6 — CRIAR `src/features/clients/pages/ClientsPage.tsx`

```tsx
import { useState, useCallback } from 'react'
import { Search, Users } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { PageWrapper } from '@/components/layout'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ClientListItem } from '../components/ClientListItem'
import { ClientDetailPanel } from '../components/ClientDetailPanel'
import { useClients } from '../hooks/useClients'
import type { ClientRow } from '@/services/clients.service'
import type { Database } from '@/types/database.types'

type IaStatus = Database['public']['Enums']['ia_status_enum']

const IA_STATUS_OPTIONS = [
  { label: 'Todos',       value: 'all' },
  { label: 'IA ativa',    value: 'active' },
  { label: 'Humano',      value: 'human_takeover' },
  { label: 'Bloqueados',  value: 'blocked' },
]

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [iaStatus, setIaStatus] = useState<'all' | IaStatus>('all')
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useClients({
    search: debouncedSearch || undefined,
    ia_status: iaStatus,
    pageSize: 50,
  })

  const clients = data?.data ?? []
  const total = data?.count ?? 0

  return (
    <PageWrapper title="Clientes" description={`${total} cliente${total !== 1 ? 's' : ''} cadastrados`}>
      {/* Layout split-panel */}
      <div className="flex gap-5 h-[calc(100vh-180px)]">

        {/* Painel esquerdo — lista */}
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-border flex flex-col overflow-hidden">

          {/* Filtros */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={iaStatus} onValueChange={(v) => setIaStatus(v as typeof iaStatus)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IA_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-sm">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-3 space-y-2">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            )}

            {!isLoading && clients.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <Users size={32} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
              </div>
            )}

            {!isLoading && clients.map((client) => (
              <ClientListItem
                key={client.id}
                client={client}
                selected={selectedClient?.id === client.id}
                onClick={() => setSelectedClient(client)}
              />
            ))}
          </div>
        </div>

        {/* Painel direito — detalhes */}
        <div className="flex-1 bg-white rounded-xl border border-border overflow-hidden">
          {selectedClient ? (
            <ClientDetailPanel
              key={selectedClient.id}
              client={selectedClient}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Users size={40} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">Selecione um cliente</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em um cliente na lista para ver os detalhes
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
```

---

## PASSO 7 — CRIAR `src/hooks/useDebounce.ts` (se não existir)

```ts
import { useState, useEffect } from 'react'

// Hook para atrasar a execução de uma busca enquanto o usuário digita
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

---

## PASSO 8 — CRIAR `src/features/clients/index.ts`

```ts
export { default as ClientsPage } from './pages/ClientsPage'
export { ClientListItem } from './components/ClientListItem'
export { ClientDetailPanel } from './components/ClientDetailPanel'
```

---

## VERIFICAÇÃO FINAL

- [ ] `/clients` renderiza sem erros
- [ ] Lista vazia mostra estado vazio com ícone
- [ ] Busca por nome/telefone filtra em tempo real (debounce 300ms)
- [ ] Filtro por status da IA funciona
- [ ] Clicar em cliente abre o painel direito com detalhes
- [ ] Toggle de IA ativa/desativa e persiste no banco
- [ ] Botão editar permite alterar nome, email e notas
- [ ] Histórico de agendamentos e conversas carrega corretamente
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem warnings
