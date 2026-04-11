import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConversationSession, SessionStatus } from '@/services/conversations.service'

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; color: string; dot: string }
> = {
  active: {
    label: 'IA ativa',
    color: 'text-green-600',
    dot: 'bg-green-500',
  },
  human_takeover: {
    label: 'Humano',
    color: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  closed: {
    label: 'Encerrada',
    color: 'text-gray-400',
    dot: 'bg-gray-300',
  },
}

interface ConversationListItemProps {
  session: ConversationSession
  selected: boolean
  onClick: () => void
}

export function ConversationListItem({
  session,
  selected,
  onClick,
}: ConversationListItemProps) {
  const status = STATUS_CONFIG[session.status]
  const clientName =
    session.clients?.name ?? session.clients?.phone ?? 'Desconhecido'
  const initials = clientName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
  const isActive = session.status === 'active'

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        'border-b border-border last:border-0',
        selected
          ? 'bg-primary/5 border-l-2 border-l-primary'
          : 'hover:bg-muted/50',
      )}
    >
      {/* Avatar com indicador de status */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">{initials}</span>
        </div>
        <div
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
            status.dot,
          )}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground truncate">
            {clientName}
          </p>
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {formatDistanceToNow(new Date(session.last_message_at), {
              locale: ptBR,
              addSuffix: true,
            })}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {isActive ? (
            <Bot size={11} className="text-green-600 flex-shrink-0" />
          ) : (
            <User size={11} className="text-amber-600 flex-shrink-0" />
          )}
          <span className={cn('text-xs truncate', status.color)}>
            {status.label}
          </span>
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
