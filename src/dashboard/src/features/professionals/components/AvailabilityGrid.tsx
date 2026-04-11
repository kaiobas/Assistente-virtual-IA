import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useAvailabilityRules,
  useAddAvailabilityRule,
  useDeleteAvailabilityRule,
  useUpdateAvailabilityRule,
} from '../hooks/useProfessionals'
import type { AvailabilityRule } from '@/services/professionals.service'

const DAYS = [
  { label: 'Domingo', short: 'Dom', value: 0 },
  { label: 'Segunda', short: 'Seg', value: 1 },
  { label: 'Terça', short: 'Ter', value: 2 },
  { label: 'Quarta', short: 'Qua', value: 3 },
  { label: 'Quinta', short: 'Qui', value: 4 },
  { label: 'Sexta', short: 'Sex', value: 5 },
  { label: 'Sábado', short: 'Sáb', value: 6 },
] as const

// Row editável de um turno
function RuleRow({
  rule,
  professionalId,
}: {
  rule: AvailabilityRule
  professionalId: string
}) {
  const [editing, setEditing] = useState(false)
  const [start, setStart] = useState(rule.start_time.slice(0, 5))
  const [end, setEnd] = useState(rule.end_time.slice(0, 5))

  const deleteRule = useDeleteAvailabilityRule()
  const updateRule = useUpdateAvailabilityRule()

  function handleSave() {
    void updateRule
      .mutateAsync({
        ruleId: rule.id,
        professionalId,
        payload: { start_time: start, end_time: end },
      })
      .then(() => setEditing(false))
  }

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <Input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-7 w-28 text-xs"
          />
          <span className="text-muted-foreground text-xs">até</span>
          <Input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="h-7 w-28 text-xs"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setEditing(false)}
          >
            <X size={12} />
          </Button>
          <Button
            size="icon"
            className="h-6 w-6"
            onClick={handleSave}
            disabled={updateRule.isPending}
          >
            <Check size={12} />
          </Button>
        </>
      ) : (
        <>
          <span className="text-sm font-medium tabular-nums">
            {rule.start_time.slice(0, 5)}
          </span>
          <span className="text-muted-foreground text-xs">–</span>
          <span className="text-sm font-medium tabular-nums">
            {rule.end_time.slice(0, 5)}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setEditing(true)}
          >
            <Pencil size={11} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() =>
              deleteRule.mutate({ ruleId: rule.id, professionalId })
            }
            disabled={deleteRule.isPending}
          >
            <Trash2 size={11} />
          </Button>
        </>
      )}
    </div>
  )
}

// Form para adicionar novo turno
function AddRuleForm({
  professionalId,
  dayOfWeek,
  onClose,
}: {
  professionalId: string
  dayOfWeek: number
  onClose: () => void
}) {
  const [start, setStart] = useState('08:00')
  const [end, setEnd] = useState('12:00')
  const addRule = useAddAvailabilityRule()

  function handleAdd() {
    void addRule
      .mutateAsync({
        professional_id: professionalId,
        day_of_week: dayOfWeek,
        start_time: start,
        end_time: end,
      })
      .then(() => onClose())
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <Input
        type="time"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        className="h-7 w-28 text-xs"
      />
      <span className="text-muted-foreground text-xs">até</span>
      <Input
        type="time"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        className="h-7 w-28 text-xs"
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={onClose}
      >
        <X size={12} />
      </Button>
      <Button
        size="icon"
        className="h-6 w-6"
        onClick={handleAdd}
        disabled={addRule.isPending}
      >
        <Check size={12} />
      </Button>
    </div>
  )
}

interface AvailabilityGridProps {
  professionalId: string
}

export function AvailabilityGrid({ professionalId }: AvailabilityGridProps) {
  const { data: rules, isLoading } = useAvailabilityRules(professionalId)
  const [addingDay, setAddingDay] = useState<number | null>(null)

  // Agrupa regras por dia da semana
  const byDay = new Map<number, AvailabilityRule[]>()
  for (const rule of rules ?? []) {
    const existing = byDay.get(rule.day_of_week)
    if (existing) {
      existing.push(rule)
    } else {
      byDay.set(rule.day_of_week, [rule])
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Grade de horários
      </p>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="space-y-1">
          {DAYS.map((day) => {
            const dayRules = byDay.get(day.value) ?? []
            const isAdding = addingDay === day.value
            const hasRules = dayRules.length > 0

            return (
              <div
                key={day.value}
                className={cn(
                  'flex items-start gap-4 px-3 py-2 rounded-lg',
                  hasRules ? 'bg-muted/30' : 'opacity-50',
                )}
              >
                {/* Dia */}
                <span
                  className={cn(
                    'text-sm w-10 flex-shrink-0 mt-0.5 font-medium',
                    hasRules ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {day.short}
                </span>

                {/* Turnos */}
                <div className="flex-1 space-y-1">
                  {dayRules.length === 0 && !isAdding && (
                    <span className="text-xs text-muted-foreground italic">
                      Folga
                    </span>
                  )}

                  {dayRules.map((rule) => (
                    <div key={rule.id} className="group">
                      <RuleRow rule={rule} professionalId={professionalId} />
                    </div>
                  ))}

                  {isAdding && (
                    <AddRuleForm
                      professionalId={professionalId}
                      dayOfWeek={day.value}
                      onClose={() => setAddingDay(null)}
                    />
                  )}
                </div>

                {/* Adicionar turno */}
                {!isAdding && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 flex-shrink-0 mt-0.5"
                    onClick={() => setAddingDay(day.value)}
                    title={`Adicionar turno — ${day.label}`}
                  >
                    <Plus size={13} />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
