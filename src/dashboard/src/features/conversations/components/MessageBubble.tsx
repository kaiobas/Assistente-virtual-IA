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
    <div
      className={cn(
        'flex items-end gap-2 mb-3',
        isUser ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-gray-200' : 'bg-primary/10',
        )}
      >
        {isUser ? (
          <User size={14} className="text-gray-600" />
        ) : (
          <Bot size={14} className="text-primary" />
        )}
      </div>

      {/* Balão */}
      <div
        className={cn(
          'max-w-[72%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'bg-muted text-foreground rounded-bl-sm'
            : 'bg-primary text-primary-foreground rounded-br-sm',
        )}
      >
        {/* Mídia (áudio, imagem, documento) */}
        {message.media_type && message.media_type !== 'text' && (
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs mb-1',
              isUser ? 'text-muted-foreground' : 'text-primary-foreground/70',
            )}
          >
            <MediaIcon type={message.media_type} />
            <span className="capitalize">{message.media_type}</span>
          </div>
        )}

        {/* Conteúdo */}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>

        {/* Horário */}
        <p
          className={cn(
            'text-xs mt-1',
            isUser ? 'text-muted-foreground' : 'text-primary-foreground/60',
          )}
        >
          {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
          {message.tokens_used !== null && isAssistant && (
            <span className="ml-1.5 opacity-60">
              {message.tokens_used} tokens
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
