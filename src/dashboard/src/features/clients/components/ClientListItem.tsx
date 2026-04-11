import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { ClientRow } from '@/services/clients.service'

// Badge de status da IA
const IA_STATUS_CONFIG = {
  active:         { label: 'IA ativa',   dot: 'bg-green-500' },
  human_takeover: { label: 'Humano',     dot: 'bg-amber-500' },
  blocked:        { label: 'Bloqueado',  dot: 'bg-red-500' },
} as const

interface ClientListItemProps {
  client: ClientRow
  selected: boolean
  onClick: () => void
}

export function ClientListItem({ client, selected, onClick }: ClientListItemProps) {
  const status = IA_STATUS_CONFIG[client.ia_status]
  const displayName = client.name ?? client.phone
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        'border-b border-border last:border-0',
        selected
          ? 'bg-primary/5 border-l-2 border-l-primary'
          : 'hover:bg-muted/50'
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
        {client.last_contact_at && (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(client.last_contact_at), {
              locale: ptBR,
              addSuffix: true,
            })}
          </span>
        )}
      </div>
    </button>
  )
}
