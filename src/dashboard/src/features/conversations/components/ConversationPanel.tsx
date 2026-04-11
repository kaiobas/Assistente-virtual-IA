import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bot, BotOff, Phone, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageBubble } from './MessageBubble'
import {
  useSessionMessages,
  useUpdateSessionStatus,
} from '../hooks/useConversations'
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
  const initials = clientName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  function handleTakeover() {
    void updateStatus.mutateAsync({
      sessionId: session.id,
      status: 'human_takeover',
    })
  }

  function handleReactivateIA() {
    void updateStatus.mutateAsync({
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
              {initials}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {clientName}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone size={10} />
              {session.clients?.phone}
              <span className="mx-1">·</span>
              Iniciada{' '}
              {format(new Date(session.started_at), 'dd/MM/yyyy', {
                locale: ptBR,
              })}
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
            onClick={() => void refetch()}
            title="Atualizar mensagens"
          >
            <RefreshCw size={14} />
          </Button>

          {/* Human takeover */}
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

          {/* Reativar IA */}
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
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} gap-2`}
              >
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <Skeleton
                  className={`h-16 rounded-2xl ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`}
                />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!messages || messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem nesta conversa
            </p>
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
          O dashboard exibe o histórico em tempo real. Respostas são enviadas
          pelo WhatsApp.
        </p>
      </div>
    </div>
  )
}
