# Prompt: Tela Profissionais

> Cole no GitHub Copilot Chat (modo Agent).
> Layout base e telas anteriores já estão prontas.

---

## CONTEXTO

A tela de profissionais tem layout split-panel:
- **Esquerda:** lista de profissionais com status ativo/inativo
- **Direita:** painel com dados do profissional + grade de horários semanal editável

A grade de horários usa `availability_rules` (turnos fixos por dia da semana) com suporte a múltiplos turnos por dia (ex: 08:00–12:00 e 13:00–19:00).

---

## BANCO DE DADOS — TABELAS RELEVANTES

```
professionals:
  id, business_id, name, display_name, specialty,
  avatar_url, active, created_at, updated_at

availability_rules:
  id, professional_id, day_of_week (0=dom...6=sáb),
  start_time, end_time, active

  Exemplo real do banco:
  Henrique — Seg a Sex: 08:00–12:00 e 13:00–19:00, Sáb: 08:00–13:00
  Gustavo  — mesma grade
```

---

## PASSO 1 — INSTALAR COMPONENTES shadcn/ui

```bash
npx shadcn@latest add alert
```

---

## PASSO 2 — CRIAR SERVICE `src/services/professionals.service.ts`

```ts
import { supabase } from '@/lib/supabase'

export interface Professional {
  id: string
  name: string
  display_name: string
  specialty: string | null
  avatar_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface AvailabilityRule {
  id: string
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

export interface UpsertProfessionalPayload {
  name: string
  display_name: string
  specialty?: string
}

export interface UpsertRulePayload {
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

// Lista todos os profissionais
export async function getProfessionals(): Promise<Professional[]> {
  const { data, error } = await supabase
    .from('professionals')
    .select('id, name, display_name, specialty, avatar_url, active, created_at, updated_at')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

// Busca regras de disponibilidade de um profissional
export async function getAvailabilityRules(professionalId: string): Promise<AvailabilityRule[]> {
  const { data, error } = await supabase
    .from('availability_rules')
    .select('id, professional_id, day_of_week, start_time, end_time, active')
    .eq('professional_id', professionalId)
    .order('day_of_week')
    .order('start_time')

  if (error) throw new Error(error.message)
  return data ?? []
}

// Cria profissional
export async function createProfessional(payload: UpsertProfessionalPayload) {
  const { data: business } = await supabase
    .from('business')
    .select('id')
    .single()

  const { data, error } = await supabase
    .from('professionals')
    .insert({ ...payload, business_id: business?.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Atualiza profissional
export async function updateProfessional(id: string, payload: Partial<UpsertProfessionalPayload> & { active?: boolean }) {
  const { data, error } = await supabase
    .from('professionals')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Adiciona turno na grade
export async function addAvailabilityRule(payload: UpsertRulePayload) {
  const { data, error } = await supabase
    .from('availability_rules')
    .insert(payload)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Remove turno da grade
export async function deleteAvailabilityRule(ruleId: string) {
  const { error } = await supabase
    .from('availability_rules')
    .delete()
    .eq('id', ruleId)

  if (error) throw new Error(error.message)
}

// Atualiza horário de um turno existente
export async function updateAvailabilityRule(
  ruleId: string,
  payload: { start_time: string; end_time: string }
) {
  const { data, error } = await supabase
    .from('availability_rules')
    .update(payload)
    .eq('id', ruleId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
```

---

## PASSO 3 — CRIAR HOOKS `src/features/professionals/hooks/useProfessionals.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getProfessionals,
  getAvailabilityRules,
  createProfessional,
  updateProfessional,
  addAvailabilityRule,
  deleteAvailabilityRule,
  updateAvailabilityRule,
  type UpsertProfessionalPayload,
  type UpsertRulePayload,
} from '@/services/professionals.service'

export function useProfessionals() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFESSIONALS],
    queryFn: getProfessionals,
  })
}

export function useAvailabilityRules(professionalId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFESSIONALS, professionalId, 'rules'],
    queryFn: () => getAvailabilityRules(professionalId!),
    enabled: !!professionalId,
  })
}

export function useCreateProfessional() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertProfessionalPayload) => createProfessional(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROFESSIONALS] }),
  })
}

export function useUpdateProfessional() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateProfessional>[1] }) =>
      updateProfessional(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROFESSIONALS] }),
  })
}

export function useAddAvailabilityRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertRulePayload) => addAvailabilityRule(payload),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROFESSIONALS, vars.professional_id, 'rules'] }),
  })
}

export function useDeleteAvailabilityRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId, professionalId }: { ruleId: string; professionalId: string }) =>
      deleteAvailabilityRule(ruleId),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROFESSIONALS, vars.professionalId, 'rules'] }),
  })
}

export function useUpdateAvailabilityRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ruleId,
      professionalId,
      payload,
    }: {
      ruleId: string
      professionalId: string
      payload: { start_time: string; end_time: string }
    }) => updateAvailabilityRule(ruleId, payload),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROFESSIONALS, vars.professionalId, 'rules'] }),
  })
}
```

---

## PASSO 4 — CRIAR `src/features/professionals/components/ProfessionalListItem.tsx`

```tsx
import { cn } from '@/lib/utils'
import type { Professional } from '@/services/professionals.service'

interface ProfessionalListItemProps {
  professional: Professional
  selected: boolean
  onClick: () => void
}

export function ProfessionalListItem({ professional, selected, onClick }: ProfessionalListItemProps) {
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
          : 'hover:bg-muted/50'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">{initials}</span>
        </div>
        {/* Indicador ativo/inativo */}
        <div className={cn(
          'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
          professional.active ? 'bg-green-500' : 'bg-gray-300'
        )} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{professional.display_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {professional.specialty ?? 'Sem especialidade'}
        </p>
      </div>

      {/* Status */}
      <span className={cn(
        'text-xs flex-shrink-0',
        professional.active ? 'text-green-600' : 'text-muted-foreground'
      )}>
        {professional.active ? 'Ativo' : 'Inativo'}
      </span>
    </button>
  )
}
```

---

## PASSO 5 — CRIAR `src/features/professionals/components/AvailabilityGrid.tsx`

```tsx
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
  { label: 'Domingo',   short: 'Dom', value: 0 },
  { label: 'Segunda',   short: 'Seg', value: 1 },
  { label: 'Terça',     short: 'Ter', value: 2 },
  { label: 'Quarta',    short: 'Qua', value: 3 },
  { label: 'Quinta',    short: 'Qui', value: 4 },
  { label: 'Sexta',     short: 'Sex', value: 5 },
  { label: 'Sábado',    short: 'Sáb', value: 6 },
]

interface AvailabilityGridProps {
  professionalId: string
}

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

  async function handleSave() {
    await updateRule.mutateAsync({
      ruleId: rule.id,
      professionalId,
      payload: { start_time: start, end_time: end },
    })
    setEditing(false)
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
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(false)}>
            <X size={12} />
          </Button>
          <Button size="icon" className="h-6 w-6" onClick={handleSave} disabled={updateRule.isPending}>
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
            onClick={() => deleteRule.mutate({ ruleId: rule.id, professionalId })}
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

  async function handleAdd() {
    await addRule.mutateAsync({ professional_id: professionalId, day_of_week: dayOfWeek, start_time: start, end_time: end })
    onClose()
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-7 w-28 text-xs" />
      <span className="text-muted-foreground text-xs">até</span>
      <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="h-7 w-28 text-xs" />
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
        <X size={12} />
      </Button>
      <Button size="icon" className="h-6 w-6" onClick={handleAdd} disabled={addRule.isPending}>
        <Check size={12} />
      </Button>
    </div>
  )
}

export function AvailabilityGrid({ professionalId }: AvailabilityGridProps) {
  const { data: rules, isLoading } = useAvailabilityRules(professionalId)
  const [addingDay, setAddingDay] = useState<number | null>(null)

  // Agrupa regras por dia da semana
  const byDay = new Map<number, AvailabilityRule[]>()
  for (const rule of rules ?? []) {
    if (!byDay.has(rule.day_of_week)) byDay.set(rule.day_of_week, [])
    byDay.get(rule.day_of_week)!.push(rule)
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Grade de horários
      </p>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}
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
                  hasRules ? 'bg-muted/30' : 'opacity-50'
                )}
              >
                {/* Dia */}
                <span className={cn(
                  'text-sm w-10 flex-shrink-0 mt-0.5 font-medium',
                  hasRules ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {day.short}
                </span>

                {/* Turnos */}
                <div className="flex-1 space-y-1">
                  {dayRules.length === 0 && !isAdding && (
                    <span className="text-xs text-muted-foreground italic">Folga</span>
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
```

---

## PASSO 6 — CRIAR `src/features/professionals/components/ProfessionalDetailPanel.tsx`

```tsx
import { useState } from 'react'
import { Edit2, Check, X, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvailabilityGrid } from './AvailabilityGrid'
import { useUpdateProfessional } from '../hooks/useProfessionals'
import type { Professional } from '@/services/professionals.service'

interface ProfessionalDetailPanelProps {
  professional: Professional
}

export function ProfessionalDetailPanel({ professional }: ProfessionalDetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(professional.name)
  const [displayName, setDisplayName] = useState(professional.display_name)
  const [specialty, setSpecialty] = useState(professional.specialty ?? '')

  const update = useUpdateProfessional()

  async function handleSave() {
    await update.mutateAsync({
      id: professional.id,
      payload: { name, display_name: displayName, specialty: specialty || undefined },
    })
    setEditing(false)
  }

  async function handleToggleActive() {
    await update.mutateAsync({
      id: professional.id,
      payload: { active: !professional.active },
    })
  }

  const initials = professional.display_name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-semibold text-primary">{initials}</span>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {editing ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome completo</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome de exibição</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Especialidade</Label>
                  <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="h-8 text-sm" placeholder="Ex: Barbeiro" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-base font-semibold">{professional.display_name}</p>
                  <p className="text-sm text-muted-foreground">{professional.name}</p>
                  {professional.specialty && (
                    <p className="text-xs text-muted-foreground mt-0.5">{professional.specialty}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-1 flex-shrink-0">
            {editing ? (
              <>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(false)}>
                  <X size={14} />
                </Button>
                <Button size="icon" className="h-8 w-8" onClick={handleSave} disabled={update.isPending}>
                  <Check size={14} />
                </Button>
              </>
            ) : (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}>
                <Edit2 size={14} />
              </Button>
            )}
          </div>
        </div>

        {/* Toggle ativo/inativo */}
        <Button
          variant="outline"
          size="sm"
          className={`mt-4 gap-1.5 text-xs ${professional.active
            ? 'text-red-600 border-red-200 hover:bg-red-50'
            : 'text-green-600 border-green-200 hover:bg-green-50'
          }`}
          onClick={handleToggleActive}
          disabled={update.isPending}
        >
          <Power size={13} />
          {professional.active ? 'Desativar profissional' : 'Ativar profissional'}
        </Button>
      </div>

      {/* Grade de horários */}
      <div className="p-5">
        <AvailabilityGrid professionalId={professional.id} />
      </div>
    </div>
  )
}
```

---

## PASSO 7 — CRIAR `src/features/professionals/components/CreateProfessionalModal.tsx`

```tsx
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateProfessional } from '../hooks/useProfessionals'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  display_name: z.string().min(2, 'Nome de exibição obrigatório'),
  specialty: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CreateProfessionalModalProps {
  open: boolean
  onClose: () => void
}

export function CreateProfessionalModal({ open, onClose }: CreateProfessionalModalProps) {
  const create = useCreateProfessional()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    await create.mutateAsync(data)
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo profissional</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome completo</Label>
            <Input {...register('name')} placeholder="Ex: João da Silva" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Nome de exibição <span className="text-muted-foreground text-xs">(usado no WhatsApp)</span></Label>
            <Input {...register('display_name')} placeholder="Ex: João" />
            {errors.display_name && <p className="text-xs text-destructive">{errors.display_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Especialidade <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input {...register('specialty')} placeholder="Ex: Barbeiro" />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>Cancelar</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={create.isPending}>
            {create.isPending ? 'Criando...' : 'Criar profissional'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## PASSO 8 — CRIAR `src/features/professionals/pages/ProfessionalsPage.tsx`

```tsx
import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfessionalListItem } from '../components/ProfessionalListItem'
import { ProfessionalDetailPanel } from '../components/ProfessionalDetailPanel'
import { CreateProfessionalModal } from '../components/CreateProfessionalModal'
import { useProfessionals } from '../hooks/useProfessionals'
import type { Professional } from '@/services/professionals.service'

export default function ProfessionalsPage() {
  const [selected, setSelected] = useState<Professional | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const { data: professionals, isLoading } = useProfessionals()

  return (
    <PageWrapper
      title="Profissionais"
      description="Gerencie a equipe e as grades de horário"
      action={
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus size={15} />
          Novo profissional
        </Button>
      }
    >
      <div className="flex gap-5 h-[calc(100vh-180px)]">
        {/* Lista */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-border overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-3 space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            )}

            {!isLoading && (!professionals || professionals.length === 0) && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <Users size={32} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum profissional cadastrado</p>
              </div>
            )}

            {!isLoading && professionals?.map((p) => (
              <ProfessionalListItem
                key={p.id}
                professional={p}
                selected={selected?.id === p.id}
                onClick={() => setSelected(p)}
              />
            ))}
          </div>
        </div>

        {/* Detalhe */}
        <div className="flex-1 bg-white rounded-xl border border-border overflow-hidden">
          {selected ? (
            <ProfessionalDetailPanel key={selected.id} professional={selected} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Users size={40} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">Selecione um profissional</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique para ver e editar dados e grade de horários
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateProfessionalModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </PageWrapper>
  )
}
```

---

## PASSO 9 — CRIAR `src/features/professionals/index.ts`

```ts
export { default as ProfessionalsPage } from './pages/ProfessionalsPage'
```

---

## VERIFICAÇÃO FINAL

- [ ] `/professionals` renderiza sem erros
- [ ] Lista mostra Henrique e Gustavo da seed
- [ ] Clicar no profissional abre o painel com grade de horários
- [ ] Grade exibe turnos corretos (Seg–Sex: 08–12 e 13–19, Sáb: 08–13)
- [ ] Botão `+` adiciona novo turno ao dia
- [ ] Hover no turno revela botões de editar e excluir
- [ ] Editar turno atualiza horários inline
- [ ] Botão desativar/ativar funciona
- [ ] Modal de novo profissional valida e cria
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem warnings
