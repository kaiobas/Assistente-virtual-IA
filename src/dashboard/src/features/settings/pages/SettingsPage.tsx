import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
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

const TIMEZONES = [
  { label: 'Cuiabá / Manaus (UTC-4)',     value: 'America/Manaus' },
  { label: 'Brasília / São Paulo (UTC-3)', value: 'America/Sao_Paulo' },
  { label: 'Fortaleza (UTC-3)',            value: 'America/Fortaleza' },
  { label: 'Belém (UTC-3)',               value: 'America/Belem' },
  { label: 'Porto Velho (UTC-4)',          value: 'America/Porto_Velho' },
  { label: 'Rio Branco (UTC-5)',           value: 'America/Rio_Branco' },
  { label: 'Noronha (UTC-2)',             value: 'America/Noronha' },
] as const

const businessSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  segment: z.string().min(1, 'Segmento obrigatório'),
  phone_number: z.string().min(1, 'Telefone obrigatório'),
  timezone: z.string().min(1, 'Timezone obrigatório'),
})

const agentSchema = z.object({
  agent_name: z.string().min(1, 'Nome do agente obrigatório'),
  agent_persona: z.string().optional(),
})

type BusinessForm = z.infer<typeof businessSchema>
type AgentForm = z.infer<typeof agentSchema>

// ─── Aba Negócio ──────────────────────────────────────────────────────────────
function BusinessTab() {
  const { data: business, isLoading } = useBusiness()
  const update = useUpdateBusiness()
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<BusinessForm>({ resolver: zodResolver(businessSchema) })

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

  function onSubmit(data: BusinessForm) {
    void update.mutateAsync(data).then(() => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      reset(data)
    })
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />

  return (
    <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} className="space-y-5 max-w-lg">
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
        <Label>
          Número do WhatsApp{' '}
          <span className="text-muted-foreground text-xs">(instância Evolution API)</span>
        </Label>
        <Input {...register('phone_number')} placeholder="Ex: 5565999990000" />
        {errors.phone_number && (
          <p className="text-xs text-destructive">{errors.phone_number.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Fuso horário</Label>
        <Controller
          control={control}
          name="timezone"
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onValueChange={(v) => { if (v) field.onChange(v) }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar fuso..." />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <Button type="submit" disabled={!isDirty || update.isPending} className="gap-1.5">
        {saved ? (
          <><Check size={14} /> Salvo!</>
        ) : update.isPending ? (
          'Salvando...'
        ) : (
          'Salvar alterações'
        )}
      </Button>
    </form>
  )
}

// ─── Aba Agente IA ────────────────────────────────────────────────────────────
function AgentTab() {
  const { data: business, isLoading } = useBusiness()
  const update = useUpdateBusiness()
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AgentForm>({ resolver: zodResolver(agentSchema) })

  useEffect(() => {
    if (business) {
      reset({
        agent_name: business.agent_name,
        agent_persona: business.agent_persona ?? '',
      })
    }
  }, [business, reset])

  function onSubmit(data: AgentForm) {
    void update.mutateAsync(data).then(() => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      reset(data)
    })
  }

  const rules = business?.business_rules ?? {}

  function handleRuleToggle(key: string, value: boolean) {
    void update.mutateAsync({ business_rules: { ...rules, [key]: value } })
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />

  return (
    <div className="space-y-8 max-w-lg">
      <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Nome do agente</Label>
          <Input {...register('agent_name')} placeholder="Ex: Bia, João, Assistente..." />
          {errors.agent_name && (
            <p className="text-xs text-destructive">{errors.agent_name.message}</p>
          )}
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
          {saved ? (
            <><Check size={14} /> Salvo!</>
          ) : update.isPending ? (
            'Salvando...'
          ) : (
            'Salvar persona'
          )}
        </Button>
      </form>

      <div>
        <p className="text-sm font-medium mb-1">Regras de negócio</p>
        <p className="text-xs text-muted-foreground mb-4">
          Comportamentos automáticos do agente durante os atendimentos.
        </p>

        <div className="space-y-3">
          {(
            [
              { key: 'desconto',               label: 'Permitir oferecer descontos',        desc: 'O agente pode mencionar ou negociar descontos' },
              { key: 'email_obrigatorio',      label: 'Email obrigatório no agendamento',   desc: 'Solicita email do cliente antes de confirmar' },
              { key: 'um_cliente_por_horario', label: 'Apenas 1 cliente por horário',       desc: 'Bloqueia o horário ao confirmar o primeiro agendamento' },
              { key: 'remarcar_exige_cancelar',label: 'Remarcar exige cancelar antes',      desc: 'Cliente precisa cancelar para agendar novo horário' },
            ] as const
          ).map(({ key, label, desc }) => (
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

// ─── Aba Conta ────────────────────────────────────────────────────────────────
function AccountTab() {
  const { user } = useAuthStore()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChangePassword() {
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
    void supabase.auth.updateUser({ password: newPassword }).then(
      ({ error: authError }) => {
        setLoading(false)
        if (authError) {
          setError(authError.message)
          return
        }
        setNewPassword('')
        setConfirmPassword('')
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
      (err: unknown) => {
        setLoading(false)
        console.error('[AccountTab] updateUser error:', err)
      },
    )
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={user?.email ?? ''} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">Para alterar o email, contate o suporte.</p>
      </div>

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
          {saved ? (
            <><Check size={14} /> Senha alterada!</>
          ) : loading ? (
            'Salvando...'
          ) : (
            'Alterar senha'
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
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
