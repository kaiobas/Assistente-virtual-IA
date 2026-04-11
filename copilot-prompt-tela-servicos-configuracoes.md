# Prompt: Telas Serviços e Configurações

> Cole no GitHub Copilot Chat (modo Agent).
> Layout base e telas anteriores já estão prontas.
> Este prompt cria duas telas: Serviços e Configurações.

---

# PARTE 1 — TELA SERVIÇOS

## CONTEXTO

Tabela de serviços agrupada por categoria, com modal para criar e editar.

Serviços existentes no banco:
- **Cortes e Combos:** Corte (R$55, 30min), Corte e Barba (R$95, 60min), Corte e Sobrancelha (R$75, 45min), Corte Barba e Sobrancelha (R$115, 60min), Corte Barba Sobrancelha e Remoção (R$135, 90min)
- **Barbas e Sobrancelhas:** Barba Terapia (R$50, 30min), Barba e Pé do Cabelo (R$70, 30min)
- **Química e Coloração:** Alisamento/Selagem (R$130, 90min), Platinado/Nevou (R$250, 90min), Luzes (R$180, 105min)

---

## BANCO DE DADOS

```
services:
  id, business_id, name, description, duration_min,
  price (numeric), category, active, created_at, updated_at
```

---

## PASSO 1 — CRIAR SERVICE `src/services/services.service.ts`

```ts
import { supabase } from '@/lib/supabase'

export interface Service {
  id: string
  name: string
  description: string | null
  duration_min: number
  price: number
  category: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface UpsertServicePayload {
  name: string
  description?: string
  duration_min: number
  price: number
  category?: string
  active?: boolean
}

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, duration_min, price, category, active, created_at, updated_at')
    .order('category')
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Service[]
}

export async function createService(payload: UpsertServicePayload) {
  const { data: business } = await supabase.from('business').select('id').single()

  const { data, error } = await supabase
    .from('services')
    .insert({ ...payload, business_id: business?.id, active: true })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateService(id: string, payload: Partial<UpsertServicePayload>) {
  const { data, error } = await supabase
    .from('services')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function toggleServiceActive(id: string, active: boolean) {
  const { error } = await supabase
    .from('services')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
```

---

## PASSO 2 — CRIAR HOOKS `src/features/services/hooks/useServices.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getServices,
  createService,
  updateService,
  toggleServiceActive,
  type UpsertServicePayload,
} from '@/services/services.service'

export function useServices() {
  return useQuery({
    queryKey: [QUERY_KEYS.SERVICES],
    queryFn: getServices,
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertServicePayload) => createService(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] }),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UpsertServicePayload> }) =>
      updateService(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] }),
  })
}

export function useToggleServiceActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleServiceActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] }),
  })
}
```

---

## PASSO 3 — CRIAR `src/features/services/components/ServiceFormModal.tsx`

```tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateService, useUpdateService } from '../hooks/useServices'
import type { Service } from '@/services/services.service'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  category: z.string().optional(),
  duration_min: z.coerce.number().min(5, 'Mínimo 5 minutos'),
  price: z.coerce.number().min(0, 'Preço inválido'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ServiceFormModalProps {
  open: boolean
  onClose: () => void
  // Se passado, entra em modo edição
  service?: Service | null
}

export function ServiceFormModal({ open, onClose, service }: ServiceFormModalProps) {
  const isEdit = !!service
  const create = useCreateService()
  const update = useUpdateService()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: service
      ? {
          name: service.name,
          category: service.category ?? '',
          duration_min: service.duration_min,
          price: service.price,
          description: service.description ?? '',
        }
      : { duration_min: 30, price: 0 },
  })

  // Atualiza form quando o serviço muda
  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        category: service.category ?? '',
        duration_min: service.duration_min,
        price: service.price,
        description: service.description ?? '',
      })
    } else {
      reset({ duration_min: 30, price: 0 })
    }
  }, [service, reset])

  const isPending = create.isPending || update.isPending

  async function onSubmit(data: FormData) {
    if (isEdit && service) {
      await update.mutateAsync({ id: service.id, payload: data })
    } else {
      await create.mutateAsync(data)
    }
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome do serviço</Label>
            <Input {...register('name')} placeholder="Ex: Corte e Barba" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Categoria <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input {...register('category')} placeholder="Ex: Cortes e Combos" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duração (minutos)</Label>
              <Input type="number" min={5} step={5} {...register('duration_min')} />
              {errors.duration_min && <p className="text-xs text-destructive">{errors.duration_min.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$)</Label>
              <Input type="number" min={0} step={0.01} {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Textarea {...register('description')} placeholder="Detalhes do serviço..." rows={2} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar serviço'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## PASSO 4 — CRIAR `src/features/services/pages/ServicesPage.tsx`

```tsx
import { useState } from 'react'
import { Plus, Pencil, Power, Clock, DollarSign } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ServiceFormModal } from '../components/ServiceFormModal'
import { useServices, useToggleServiceActive } from '../hooks/useServices'
import type { Service } from '@/services/services.service'
import { cn } from '@/lib/utils'

export default function ServicesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const { data: services, isLoading } = useServices()
  const toggleActive = useToggleServiceActive()

  // Agrupa serviços por categoria
  const grouped = new Map<string, Service[]>()
  for (const s of services ?? []) {
    const cat = s.category ?? 'Sem categoria'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(s)
  }

  function handleEdit(service: Service) {
    setEditingService(service)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingService(null)
  }

  return (
    <PageWrapper
      title="Serviços"
      description="Catálogo de serviços oferecidos"
      action={
        <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5">
          <Plus size={15} />
          Novo serviço
        </Button>
      }
    >
      {isLoading && (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-16 w-full rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && grouped.size === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <DollarSign size={40} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">Nenhum serviço cadastrado</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em "Novo serviço" para começar</p>
        </div>
      )}

      {/* Grupos por categoria */}
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([category, categoryServices]) => (
          <div key={category}>
            {/* Header da categoria */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold text-foreground">{category}</h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {categoryServices.length} serviço{categoryServices.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Tabela da categoria */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Serviço</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Duração</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Preço</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categoryServices.map((service) => (
                    <tr
                      key={service.id}
                      className={cn(
                        'hover:bg-muted/30 transition-colors',
                        !service.active && 'opacity-50'
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {service.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock size={13} />
                          <span>{service.duration_min} min</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        R$ {Number(service.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={service.active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                          }
                        >
                          {service.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleEdit(service)}
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn('h-7 w-7', service.active ? 'text-destructive' : 'text-green-600')}
                            onClick={() => toggleActive.mutate({ id: service.id, active: !service.active })}
                            disabled={toggleActive.isPending}
                            title={service.active ? 'Desativar' : 'Ativar'}
                          >
                            <Power size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <ServiceFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        service={editingService}
      />
    </PageWrapper>
  )
}
```

---

## PASSO 5 — CRIAR `src/features/services/index.ts`

```ts
export { default as ServicesPage } from './pages/ServicesPage'
```

---

# PARTE 2 — TELA CONFIGURAÇÕES

## CONTEXTO

Três abas: **Negócio** (dados básicos), **Agente IA** (persona + regras), **Conta** (email/senha do usuário).

Dados reais do banco:
```json
{
  "name": "Barbearia",
  "segment": "barbearia",
  "phone_number": "whatsap-comercial-testes",
  "timezone": "America/Manaus",
  "agent_name": "Bia",
  "agent_persona": "Meiga, cuidadosa e atenciosa...",
  "business_rules": {
    "desconto": false,
    "email_obrigatorio": true,
    "titulo_agendamento": "{nome} - {barbeiro} - {serviço}",
    "max_frases_resposta": 5,
    "um_cliente_por_horario": true,
    "remarcar_exige_cancelar": true
  }
}
```

---

## PASSO 6 — CRIAR SERVICE `src/services/business.service.ts`

```ts
import { supabase } from '@/lib/supabase'

export interface Business {
  id: string
  name: string
  segment: string
  phone_number: string
  timezone: string
  agent_name: string
  agent_persona: string | null
  business_rules: Record<string, unknown>
  modules_enabled: Record<string, boolean>
  active: boolean
}

export interface UpdateBusinessPayload {
  name?: string
  segment?: string
  phone_number?: string
  timezone?: string
  agent_name?: string
  agent_persona?: string
  business_rules?: Record<string, unknown>
}

export async function getBusiness(): Promise<Business> {
  const { data, error } = await supabase
    .from('business')
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Business
}

export async function updateBusiness(payload: UpdateBusinessPayload) {
  const { data: current } = await supabase.from('business').select('id').single()

  const { data, error } = await supabase
    .from('business')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', current!.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
```

---

## PASSO 7 — CRIAR HOOKS `src/features/settings/hooks/useSettings.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { getBusiness, updateBusiness, type UpdateBusinessPayload } from '@/services/business.service'

export function useBusiness() {
  return useQuery({
    queryKey: [QUERY_KEYS.BUSINESS],
    queryFn: getBusiness,
  })
}

export function useUpdateBusiness() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateBusinessPayload) => updateBusiness(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.BUSINESS] }),
  })
}
```

---

## PASSO 8 — CRIAR `src/features/settings/pages/SettingsPage.tsx`

```tsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Bot, User, Check } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusiness, useUpdateBusiness } from '../hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'

// Timezones brasileiros comuns
const TIMEZONES = [
  { label: 'Cuiabá / Manaus (UTC-4)',    value: 'America/Manaus' },
  { label: 'Brasília / São Paulo (UTC-3)', value: 'America/Sao_Paulo' },
  { label: 'Fortaleza (UTC-3)',            value: 'America/Fortaleza' },
  { label: 'Belém (UTC-3)',               value: 'America/Belem' },
  { label: 'Porto Velho (UTC-4)',          value: 'America/Porto_Velho' },
  { label: 'Rio Branco (UTC-5)',           value: 'America/Rio_Branco' },
  { label: 'Noronha (UTC-2)',             value: 'America/Noronha' },
]

// Schema aba Negócio
const businessSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  segment: z.string().min(1, 'Segmento obrigatório'),
  phone_number: z.string().min(1, 'Telefone obrigatório'),
  timezone: z.string().min(1, 'Timezone obrigatório'),
})

// Schema aba Agente IA
const agentSchema = z.object({
  agent_name: z.string().min(1, 'Nome do agente obrigatório'),
  agent_persona: z.string().optional(),
})

type BusinessForm = z.infer<typeof businessSchema>
type AgentForm = z.infer<typeof agentSchema>

// Componente da aba Negócio
function BusinessTab() {
  const { data: business, isLoading } = useBusiness()
  const update = useUpdateBusiness()
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
  })

  useEffect(() => {
    if (business) {
      reset({
        name: business.name,
        segment: business.segment,
        phone_number: business.phone_number,
        timezone: business.timezone,
      })
    }
  }, [business, reset])

  async function onSubmit(data: BusinessForm) {
    await update.mutateAsync(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    reset(data)
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <Label>Nome do negócio</Label>
        <Input {...register('name')} placeholder="Ex: Barbearia do João" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Segmento</Label>
        <Input {...register('segment')} placeholder="Ex: barbearia, clínica, salão" />
        {errors.segment && <p className="text-xs text-destructive">{errors.segment.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Número do WhatsApp <span className="text-muted-foreground text-xs">(instância Evolution API)</span></Label>
        <Input {...register('phone_number')} placeholder="Ex: 5565999990000" />
        {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Fuso horário</Label>
        <Select value={watch('timezone')} onValueChange={(v) => setValue('timezone', v, { shouldDirty: true })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar fuso..." />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={!isDirty || update.isPending} className="gap-1.5">
        {saved ? <><Check size={14} /> Salvo!</> : update.isPending ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </form>
  )
}

// Componente da aba Agente IA
function AgentTab() {
  const { data: business, isLoading } = useBusiness()
  const update = useUpdateBusiness()
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<AgentForm>({
    resolver: zodResolver(agentSchema),
  })

  useEffect(() => {
    if (business) {
      reset({
        agent_name: business.agent_name,
        agent_persona: business.agent_persona ?? '',
      })
    }
  }, [business, reset])

  async function onSubmit(data: AgentForm) {
    await update.mutateAsync(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    reset(data)
  }

  // Regras de negócio do JSONB — exibição de leitura/escrita simplificada
  const rules = business?.business_rules ?? {}

  async function handleRuleToggle(key: string, value: boolean) {
    await update.mutateAsync({
      business_rules: { ...rules, [key]: value },
    })
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />

  return (
    <div className="space-y-8 max-w-lg">
      {/* Persona */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Nome do agente</Label>
          <Input {...register('agent_name')} placeholder="Ex: Bia, João, Assistente..." />
          {errors.agent_name && <p className="text-xs text-destructive">{errors.agent_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Persona / Instruções do agente</Label>
          <p className="text-xs text-muted-foreground">
            Descreva como o agente deve se comportar, tom de voz, limitações e instruções especiais.
          </p>
          <Textarea
            {...register('agent_persona')}
            rows={5}
            placeholder="Ex: Seja cordial e objetivo. Não ofereça descontos. Sempre confirme o nome do cliente antes de agendar..."
          />
        </div>

        <Button type="submit" disabled={!isDirty || update.isPending} className="gap-1.5">
          {saved ? <><Check size={14} /> Salvo!</> : update.isPending ? 'Salvando...' : 'Salvar persona'}
        </Button>
      </form>

      {/* Regras de negócio */}
      <div>
        <p className="text-sm font-medium mb-1">Regras de negócio</p>
        <p className="text-xs text-muted-foreground mb-4">
          Comportamentos automáticos do agente durante os atendimentos.
        </p>

        <div className="space-y-3">
          {[
            { key: 'desconto',              label: 'Permitir oferecer descontos',         desc: 'O agente pode mencionar ou negociar descontos' },
            { key: 'email_obrigatorio',     label: 'Email obrigatório no agendamento',    desc: 'Solicita email do cliente antes de confirmar' },
            { key: 'um_cliente_por_horario',label: 'Apenas 1 cliente por horário',        desc: 'Bloqueia o horário ao confirmar o primeiro agendamento' },
            { key: 'remarcar_exige_cancelar',label: 'Remarcar exige cancelar antes',     desc: 'Cliente precisa cancelar para agendar novo horário' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4 p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch
                checked={Boolean(rules[key])}
                onCheckedChange={(v) => handleRuleToggle(key, v)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente da aba Conta
function AccountTab() {
  const { user } = useAuthStore()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleChangePassword() {
    setError(null)
    if (newPassword.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Email — somente leitura */}
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={user?.email ?? ''} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">Para alterar o email, contate o suporte.</p>
      </div>

      {/* Alterar senha */}
      <div className="space-y-4 p-4 border rounded-xl">
        <p className="text-sm font-medium">Alterar senha</p>

        <div className="space-y-1.5">
          <Label>Nova senha</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Confirmar nova senha</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button
          onClick={handleChangePassword}
          disabled={!newPassword || !confirmPassword || loading}
          className="gap-1.5"
        >
          {saved ? <><Check size={14} /> Senha alterada!</> : loading ? 'Salvando...' : 'Alterar senha'}
        </Button>
      </div>
    </div>
  )
}

// Página principal
export default function SettingsPage() {
  return (
    <PageWrapper title="Configurações" description="Gerencie seu negócio e o agente IA">
      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="h-9">
          <TabsTrigger value="business" className="gap-1.5 text-xs">
            <Building2 size={14} />
            Negócio
          </TabsTrigger>
          <TabsTrigger value="agent" className="gap-1.5 text-xs">
            <Bot size={14} />
            Agente IA
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-1.5 text-xs">
            <User size={14} />
            Conta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business"><BusinessTab /></TabsContent>
        <TabsContent value="agent"><AgentTab /></TabsContent>
        <TabsContent value="account"><AccountTab /></TabsContent>
      </Tabs>
    </PageWrapper>
  )
}
```

---

## PASSO 9 — CRIAR `src/features/settings/index.ts`

```ts
export { default as SettingsPage } from './pages/SettingsPage'
```

---

## VERIFICAÇÃO FINAL — SERVIÇOS

- [ ] `/services` renderiza sem erros
- [ ] Serviços aparecem agrupados por categoria (3 grupos da seed)
- [ ] Preço e duração corretos para cada serviço
- [ ] Botão editar abre modal preenchido com dados do serviço
- [ ] Modal salva alterações e atualiza a tabela
- [ ] Botão ativar/desativar altera status visual
- [ ] Modal de novo serviço cria e aparece na lista

## VERIFICAÇÃO FINAL — CONFIGURAÇÕES

- [ ] `/settings` renderiza sem erros
- [ ] Aba Negócio carrega dados reais do banco (nome, segmento, timezone)
- [ ] Salvar alterações no negócio persiste no banco
- [ ] Aba Agente IA mostra persona da "Bia" e regras de negócio
- [ ] Toggles das regras atualizam o JSONB no banco
- [ ] Aba Conta mostra email do usuário logado (somente leitura)
- [ ] Alteração de senha valida e persiste
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem warnings
