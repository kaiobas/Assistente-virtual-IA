# Prompt: Tela Conversas

> Cole no GitHub Copilot Chat (modo Agent).
> Layout base, Overview, Agendamentos e Clientes já estão prontos.

---

## CONTEXTO

A tela de conversas tem layout estilo WhatsApp Web:
- **Esquerda:** lista de sessões de conversa ordenadas por última mensagem
- **Direita:** histórico completo de mensagens da sessão selecionada com opção de human takeover

---

## BANCO DE DADOS — TABELAS RELEVANTES

```
conversation_sessions:
  id, session_id (text — chave do n8n), client_id, business_id,
  status (active | human_takeover | closed),
  context_summary, started_at, last_message_at, closed_at
  → join: clients(name, phone, ia_status)

conversation_messages:
  id, session_id (uuid → FK), role (user | assistant | tool),
  content, media_type (text | audio | image | document),
  media_url, tokens_used, created_at
```

---

## PASSO 1 — INSTALAR COMPONENTES shadcn/ui

```bash
npx shadcn@latest add scroll-area
```

---

## PASSO 2 — CRIAR SERVICE `src/services/conversations.service.ts`

```ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type SessionStatus = Database['public']['Enums']['session_status']

export interface ConversationSession {
  id: string
  session_id: string
  status: SessionStatus
  context_summary: string | null
  started_at: string
  last_message_at: string
  closed_at: string | null
  clients: {
    id: string
    name: string | null
    phone: string
    ia_status: string
  } | null
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  media_type: string | null
  media_url: string | null
  tokens_used: number | null
  created_at: string
}

export interface ConversationFilters {
  status?: SessionStatus | 'all'
  search?: string
}

// Lista de sessões com filtro
export async function getConversationSessions(filters: ConversationFilters = {}) {
  const { status, search } = filters

  let query = supabase
    .from('conversation_sessions')
    .select(`
      id, session_id, status, context_summary,
      started_at, last_message_at, closed_at,
      clients(id, name, phone, ia_status)
    `)
    .order('last_message_at', { ascending: false })
    .limit(50)

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  // Filtra por nome/telefone do cliente no client-side (evita join complexo)
  let sessions = (data ?? []) as ConversationSession[]
  if (search) {
    const q = search.toLowerCase()
    sessions = sessions.filter((s) =>
      s.clients?.name?.toLowerCase().includes(q) ||
      s.clients?.phone?.includes(q)
    )
  }

  return sessions
}

// Mensagens de uma sessão
export async function getSessionMessages(sessionId: string): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('id, role, content, media_type, media_url, tokens_used, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ConversationMessage[]
}

// Atualiza status da sessão (human takeover / reativar IA)
export async function updateSessionStatus(sessionId: string, status: SessionStatus) {
  const { error } = await supabase
    .from('conversation_sessions')
    .update({ status })
    .eq('id', sessionId)

  if (error) throw new Error(error.message)
}
```

---

## PASSO 3 — CRIAR HOOKS `src/features/conversations/hooks/useConversations.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getConversationSessions,
  getSessionMessages,
  updateSessionStatus,
  type ConversationFilters,
} from '@/services/conversations.service'
import type { Database } from '@/types/database.types'

type SessionStatus = Database['public']['Enums']['session_status']

export function useConversationSessions(filters: ConversationFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, filters],
    queryFn: () => getConversationSessions(filters),
    // Atualiza a cada 30s — conversas mudam com frequência
    refetchInterval: 1000 * 30,
  })
}

export function useSessionMessages(sessionId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, sessionId, 'messages'],
    queryFn: () => getSessionMessages(sessionId!),
    enabled: !!sessionId,
    // Atualiza a cada 10s quando uma sessão está aberta
    refetchInterval: 1000 * 10,
  })
}

export function useUpdateSessionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: SessionStatus }) =>
      updateSessionStatus(sessionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONVERSATIONS] })
    },
  })
}
```

---

## PASSO 4 — CRIAR `src/features/conversations/components/ConversationListItem.tsx`

```tsx
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bot, User, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConversationSession } from '@/services/conversations.service'

const STATUS_CONFIG = {
  active:         { label: 'IA ativa',   color: 'text-green-600',  dot: 'bg-green-500' },
  human_takeover: { label: 'Humano',     color: 'text-amber-600',  dot: 'bg-amber-500' },
  closed:         { label: 'Encerrada',  color: 'text-gray-400',   dot: 'bg-gray-300' },
}

interface ConversationListItemProps {
  session: ConversationSession
  selected: boolean
  onClick: () => void
}

export function ConversationListItem({ session, selected, onClick }: ConversationListItemProps) {
  const status = STATUS_CONFIG[session.status]
  const clientName = session.clients?.name ?? session.clients?.phone ?? 'Desconhecido'
  const initials = clientName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
  const isActive = session.status === 'active'

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        'border-b border-border last:border-0',
        selected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'
      )}
    >
      {/* Avatar com indicador de status */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">{initials}</span>
        </div>
        <div className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', status.dot)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground truncate">{clientName}</p>
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {formatDistanceToNow(new Date(session.last_message_at), { locale: ptBR, addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {isActive
            ? <Bot size={11} className="text-green-600 flex-shrink-0" />
            : <User size={11} className="text-amber-600 flex-shrink-0" />
          }
          <span className={cn('text-xs truncate', status.color)}>{status.label}</span>
          {session.context_summary && (
            <span className="text-xs text-muted-foreground truncate ml-1">
              · {session.context_summary}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
```

---

## PASSO 5 — CRIAR `src/features/conversations/components/MessageBubble.tsx`

```tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bot, User, Wrench, Mic, Image, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConversationMessage } from '@/services/conversations.service'

interface MessageBubbleProps {
  message: ConversationMessage
}

// Ícone por tipo de mídia
function MediaIcon({ type }: { type: string }) {
  if (type === 'audio') return <Mic size={14} />
  if (type === 'image') return <Image size={14} />
  if (type === 'document') return <FileText size={14} />
  return null
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isTool = message.role === 'tool'

  // Mensagens de tool são exibidas como log interno
  if (isTool) {
    return (
      <div className="flex justify-center my-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          <Wrench size={11} />
          <span className="truncate max-w-xs">{message.content}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-end gap-2 mb-3', isUser ? 'flex-row' : 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
        isUser ? 'bg-gray-200' : 'bg-primary/10'
      )}>
        {isUser
          ? <User size={14} className="text-gray-600" />
          : <Bot size={14} className="text-primary" />
        }
      </div>

      {/* Balão */}
      <div className={cn(
        'max-w-[72%] rounded-2xl px-4 py-2.5',
        isUser
          ? 'bg-muted text-foreground rounded-bl-sm'
          : 'bg-primary text-primary-foreground rounded-br-sm'
      )}>
        {/* Mídia (áudio, imagem, documento) */}
        {message.media_type && message.media_type !== 'text' && (
          <div className={cn(
            'flex items-center gap-1.5 text-xs mb-1',
            isUser ? 'text-muted-foreground' : 'text-primary-foreground/70'
          )}>
            <MediaIcon type={message.media_type} />
            <span className="capitalize">{message.media_type}</span>
          </div>
        )}

        {/* Conteúdo */}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>

        {/* Horário */}
        <p className={cn(
          'text-xs mt-1',
          isUser ? 'text-muted-foreground' : 'text-primary-foreground/60'
        )}>
          {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
          {message.tokens_used && isAssistant && (
            <span className="ml-1.5 opacity-60">{message.tokens_used} tokens</span>
          )}
        </p>
      </div>
    </div>
  )
}
```

---

## PASSO 6 — CRIAR `src/features/conversations/components/ConversationPanel.tsx`

```tsx
import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bot, BotOff, Phone, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageBubble } from './MessageBubble'
import { useSessionMessages, useUpdateSessionStatus } from '../hooks/useConversations'
import type { ConversationSession } from '@/services/conversations.service'

interface ConversationPanelProps {
  session: ConversationSession
}

export function ConversationPanel({ session }: ConversationPanelProps) {
  const { data: messages, isLoading, refetch } = useSessionMessages(session.id)
  const updateStatus = useUpdateSessionStatus()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll automático para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isActive = session.status === 'active'
  const isHumanTakeover = session.status === 'human_takeover'
  const clientName = session.clients?.name ?? session.clients?.phone ?? 'Cliente'

  async function handleTakeover() {
    await updateStatus.mutateAsync({
      sessionId: session.id,
      status: 'human_takeover',
    })
  }

  async function handleReactivateIA() {
    await updateStatus.mutateAsync({
      sessionId: session.id,
      status: 'active',
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header da conversa */}
      <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {clientName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{clientName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone size={10} />
              {session.clients?.phone}
              <span className="mx-1">·</span>
              Iniciada {format(new Date(session.started_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Atualizar mensagens */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
            title="Atualizar mensagens"
          >
            <RefreshCw size={14} />
          </Button>

          {/* Human takeover / reativar IA */}
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={handleTakeover}
              disabled={updateStatus.isPending}
            >
              <BotOff size={14} />
              Assumir conversa
            </Button>
          )}

          {isHumanTakeover && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
              onClick={handleReactivateIA}
              disabled={updateStatus.isPending}
            >
              <Bot size={14} />
              Reativar IA
            </Button>
          )}
        </div>
      </div>

      {/* Banner de status human takeover */}
      {isHumanTakeover && (
        <div className="flex items-center gap-2 px-5 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          <BotOff size={13} />
          Atendimento manual ativo — a IA não está respondendo nesta conversa
        </div>
      )}

      {/* Área de mensagens */}
      <ScrollArea className="flex-1 px-5 py-4">
        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} gap-2`}>
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!messages || messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma mensagem nesta conversa</p>
          </div>
        )}

        {!isLoading && messages && messages.length > 0 && (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </ScrollArea>

      {/* Footer informativo — dashboard é somente leitura */}
      <div className="px-5 py-3 border-t bg-muted/30 flex-shrink-0">
        <p className="text-xs text-muted-foreground text-center">
          O dashboard exibe o histórico em tempo real. Respostas são enviadas pelo WhatsApp.
        </p>
      </div>
    </div>
  )
}
```

---

## PASSO 7 — CRIAR `src/features/conversations/pages/ConversationsPage.tsx`

```tsx
import { useState } from 'react'
import { MessageSquare, Search } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ConversationListItem } from '../components/ConversationListItem'
import { ConversationPanel } from '../components/ConversationPanel'
import { useConversationSessions } from '../hooks/useConversations'
import type { ConversationSession } from '@/services/conversations.service'
import type { Database } from '@/types/database.types'

type SessionStatus = Database['public']['Enums']['session_status']

const STATUS_OPTIONS = [
  { label: 'Todas',       value: 'all' },
  { label: 'IA ativa',    value: 'active' },
  { label: 'Humano',      value: 'human_takeover' },
  { label: 'Encerradas',  value: 'closed' },
]

export default function ConversationsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SessionStatus>('all')
  const [selectedSession, setSelectedSession] = useState<ConversationSession | null>(null)

  const { data: sessions, isLoading } = useConversationSessions({
    status: statusFilter,
    search: search || undefined,
  })

  return (
    <PageWrapper title="Conversas" description="Histórico de atendimentos via WhatsApp">
      {/* Layout estilo WhatsApp Web */}
      <div className="flex h-[calc(100vh-180px)] bg-white rounded-xl border border-border overflow-hidden">

        {/* Painel esquerdo — lista de sessões */}
        <div className="w-80 flex-shrink-0 border-r flex flex-col">
          {/* Filtros */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-sm">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de sessões */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-3 space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            )}

            {!isLoading && (!sessions || sessions.length === 0) && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <MessageSquare size={32} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
              </div>
            )}

            {!isLoading && sessions?.map((session) => (
              <ConversationListItem
                key={session.id}
                session={session}
                selected={selectedSession?.id === session.id}
                onClick={() => setSelectedSession(session)}
              />
            ))}
          </div>
        </div>

        {/* Painel direito — mensagens */}
        <div className="flex-1 overflow-hidden">
          {selectedSession ? (
            <ConversationPanel
              key={selectedSession.id}
              session={selectedSession}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <MessageSquare size={40} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">Selecione uma conversa</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em uma conversa para ver o histórico de mensagens
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

## PASSO 8 — CRIAR `src/features/conversations/index.ts`

```ts
export { default as ConversationsPage } from './pages/ConversationsPage'
export { ConversationListItem } from './components/ConversationListItem'
export { ConversationPanel } from './components/ConversationPanel'
export { MessageBubble } from './components/MessageBubble'
```

---

## VERIFICAÇÃO FINAL

- [ ] `/conversations` renderiza sem erros
- [ ] Lista de conversas vazia mostra estado vazio com ícone
- [ ] Filtro por status funciona
- [ ] Busca por nome/telefone filtra a lista
- [ ] Clicar em conversa abre o painel de mensagens à direita
- [ ] Mensagens do usuário aparecem à esquerda, do assistente à direita
- [ ] Mensagens `tool` aparecem como linha de log centralizada
- [ ] Botão "Assumir conversa" aparece quando status é `active`
- [ ] Botão "Reativar IA" aparece quando status é `human_takeover`
- [ ] Banner amarelo aparece quando em human takeover
- [ ] Scroll automático vai para a última mensagem ao abrir
- [ ] Atualização automática a cada 10s quando sessão está aberta
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem warnings
