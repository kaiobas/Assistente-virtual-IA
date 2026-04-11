import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'amber' | 'red' | 'gray'
  loading?: boolean
}

const colorMap = {
  blue:  { bg: 'bg-blue-50',   icon: 'text-blue-500' },
  green: { bg: 'bg-green-50',  icon: 'text-green-600' },
  amber: { bg: 'bg-amber-50',  icon: 'text-amber-500' },
  red:   { bg: 'bg-red-50',    icon: 'text-red-500' },
  gray:  { bg: 'bg-gray-100',  icon: 'text-gray-500' },
}

export function MetricCard({ label, value, icon: Icon, color = 'blue', loading }: MetricCardProps) {
  const colors = colorMap[color]

  return (
    <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
        <Icon size={18} className={colors.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading
          ? <Skeleton className="h-6 w-12 mt-0.5" />
          : <p className="text-xl font-semibold text-foreground leading-tight">{value}</p>
        }
      </div>
    </div>
  )
}
