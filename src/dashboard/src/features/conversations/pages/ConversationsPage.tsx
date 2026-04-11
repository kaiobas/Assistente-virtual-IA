import { useState } from 'react'
import { MessageSquare, Search } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ConversationListItem } from '../components/ConversationListItem'
import { ConversationPanel } from '../components/ConversationPanel'
import { useConversationSessions } from '../hooks/useConversations'
import type { ConversationSession, SessionStatus } from '@/services/conversations.service'

const STATUS_OPTIONS: { label: string; value: 'all' | SessionStatus }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'IA ativa', value: 'active' },
  { label: 'Humano', value: 'human_takeover' },
  { label: 'Encerradas', value: 'closed' },
]

export default function ConversationsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SessionStatus>('all')
  const [selectedSession, setSelectedSession] =
    useState<ConversationSession | null>(null)

  const { data: sessions, isLoading } = useConversationSessions({
    status: statusFilter,
    search: search || undefined,
  })

  return (
    <PageWrapper
      title="Conversas"
      description="Histórico de atendimentos via WhatsApp"
    >
      {/* Layout estilo WhatsApp Web */}
      <div className="flex h-[calc(100vh-180px)] bg-white rounded-xl border border-border overflow-hidden">
        {/* Painel esquerdo — lista de sessões */}
        <div className="w-80 flex-shrink-0 border-r flex flex-col">
          {/* Filtros */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                if (v !== null) setStatusFilter(v)
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem
                    key={o.value}
                    value={o.value}
                    className="text-sm"
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de sessões */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-3 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!isLoading && (!sessions || sessions.length === 0) && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <MessageSquare
                  size={32}
                  className="text-muted-foreground/40 mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  Nenhuma conversa encontrada
                </p>
              </div>
            )}

            {!isLoading &&
              sessions?.map((session) => (
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
              <MessageSquare
                size={40}
                className="text-muted-foreground/30 mb-3"
              />
              <p className="text-sm font-medium text-foreground">
                Selecione uma conversa
              </p>
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
