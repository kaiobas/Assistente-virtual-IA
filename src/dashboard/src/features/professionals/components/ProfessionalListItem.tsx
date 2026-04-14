import { cn } from '@/lib/utils'
import type { Professional } from '@/services/professionals.service'

interface ProfessionalListItemProps {
  professional: Professional
  selected: boolean
  onClick: () => void
}

export function ProfessionalListItem({
  professional,
  selected,
  onClick,
}: ProfessionalListItemProps) {
  const initials = professional.display_name
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
        selected
          ? 'bg-primary/5 border-l-2 border-l-primary'
          : 'hover:bg-muted/50',
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">{initials}</span>
        </div>
        {/* Indicador ativo/inativo */}
        <div
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
            professional.active ? 'bg-green-500' : 'bg-gray-300',
          )}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {professional.display_name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {professional.specialty ?? 'Sem especialidade'}
        </p>
      </div>

      {/* Status */}
      <span
        className={cn(
          'text-xs flex-shrink-0',
          professional.active ? 'text-green-600' : 'text-muted-foreground',
        )}
      >
        {professional.active ? 'Ativo' : 'Inativo'}
      </span>
    </button>
  )
}
