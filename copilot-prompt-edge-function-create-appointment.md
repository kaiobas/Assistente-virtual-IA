# Prompt: Edge Function — create-appointment

> Cole no GitHub Copilot Chat (modo Agent).
> Branch: kaio

---

## CONTEXTO

Hoje o modal de criar agendamento faz um INSERT direto via PostgREST **sem validar
disponibilidade**. Se o dono criar um agendamento pelo dashboard no mesmo horário
que o n8n criou via WhatsApp, há conflito silencioso.

A Edge Function resolve isso com uma única transação que:
1. Valida sobreposição de horário do profissional
2. Calcula `ends_at` com base na duração do serviço
3. Cria o agendamento
4. Cria as notificações na fila (respeitando `notification_settings`)

---

## PARTE 1 — EDGE FUNCTION (Deno/TypeScript)

### Estrutura de arquivos a criar:

```
supabase/
  functions/
    create-appointment/
      index.ts
```

### `supabase/functions/create-appointment/index.ts`

```ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CreateAppointmentBody {
  client_id: string
  professional_id: string
  service_id: string
  scheduled_at: string  // ISO 8601
  notes?: string
}

interface NotificationSetting {
  type: string
  enabled: boolean
  advance_hours: number
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return errorResponse('Método não permitido', 405)
  }

  try {
    // Inicializa cliente com token do usuário logado (respeita RLS)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse('Token não fornecido', 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Cliente admin para operações sem RLS (inserir notificações)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Parse do body
    const body = await req.json() as CreateAppointmentBody
    const { client_id, professional_id, service_id, scheduled_at, notes } = body

    // ── Validação básica ────────────────────────────────────────────────────
    if (!client_id || !professional_id || !service_id || !scheduled_at) {
      return errorResponse('Campos obrigatórios: client_id, professional_id, service_id, scheduled_at', 400)
    }

    const scheduledAtDate = new Date(scheduled_at)
    if (isNaN(scheduledAtDate.getTime())) {
      return errorResponse('scheduled_at inválido', 400)
    }

    if (scheduledAtDate < new Date()) {
      return errorResponse('Não é possível agendar no passado', 400)
    }

    // ── Busca duração do serviço ────────────────────────────────────────────
    const { data: service, error: svcErr } = await supabase
      .from('services')
      .select('duration_min, name')
      .eq('id', service_id)
      .eq('active', true)
      .single()

    if (svcErr || !service) {
      return errorResponse('Serviço não encontrado ou inativo', 404)
    }

    const endsAt = new Date(scheduledAtDate.getTime() + service.duration_min * 60 * 1000)

    // ── Verifica sobreposição de horário ────────────────────────────────────
    // Busca agendamentos ativos do profissional que se sobreponham ao intervalo
    const { data: overlapping } = await supabase
      .from('appointments')
      .select('id, scheduled_at, ends_at')
      .eq('professional_id', professional_id)
      .not('status', 'in', '(cancelled_by_client,cancelled_by_business,cancelled_auto,no_show)')
      .lt('scheduled_at', endsAt.toISOString())   // começa antes do fim do novo
      .gt('ends_at', scheduledAtDate.toISOString()) // termina depois do início do novo

    if (overlapping && overlapping.length > 0) {
      return errorResponse(
        `Horário indisponível — o profissional já tem agendamento das ` +
        `${new Date(overlapping[0].scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ` +
        `às ${new Date(overlapping[0].ends_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        409
      )
    }

    // ── Busca business_id do usuário ────────────────────────────────────────
    const { data: businessUser } = await supabase
      .from('business_users')
      .select('business_id')
      .single()

    if (!businessUser) return errorResponse('Negócio não encontrado', 404)
    const businessId = businessUser.business_id

    // ── Cria o agendamento ──────────────────────────────────────────────────
    const { data: appointment, error: apptErr } = await supabase
      .from('appointments')
      .insert({
        business_id: businessId,
        client_id,
        professional_id,
        service_id,
        scheduled_at: scheduledAtDate.toISOString(),
        ends_at: endsAt.toISOString(),
        notes: notes ?? null,
        status: 'confirmed',
        source: 'dashboard',
      })
      .select('id')
      .single()

    if (apptErr || !appointment) {
      return errorResponse(`Erro ao criar agendamento: ${apptErr?.message}`, 500)
    }

    const appointmentId = appointment.id

    // ── Cria notificações na fila ───────────────────────────────────────────
    // Busca configurações de notificação do negócio
    const { data: settings } = await admin
      .from('notification_settings')
      .select('type, enabled, advance_hours')
      .eq('business_id', businessId)

    const notificationQueue: Array<{
      appointment_id: string
      client_id: string
      type: string
      send_at: string
      status: string
    }> = []

    for (const setting of (settings ?? []) as NotificationSetting[]) {
      if (!setting.enabled) continue

      // Calcula send_at baseado no tipo e antecedência
      let sendAt: Date

      if (setting.type === 'booking_created' || setting.type === 'booking_confirmed') {
        // Imediato — envia agora
        sendAt = new Date()
      } else if (
        setting.type === 'confirmation_request' ||
        setting.type === 'reminder_d1' ||
        setting.type === 'reminder_h2'
      ) {
        // X horas antes do agendamento
        sendAt = new Date(scheduledAtDate.getTime() - setting.advance_hours * 60 * 60 * 1000)
        // Se o send_at já passou (ex: agendou pra daqui 1h mas lembrete é D-1), pula
        if (sendAt < new Date()) continue
      } else {
        continue
      }

      notificationQueue.push({
        appointment_id: appointmentId,
        client_id,
        type: setting.type,
        send_at: sendAt.toISOString(),
        status: 'pending',
      })
    }

    // Insere todas as notificações de uma vez (admin bypassa RLS)
    if (notificationQueue.length > 0) {
      const { error: notifErr } = await admin
        .from('notification_queue')
        .insert(notificationQueue)

      if (notifErr) {
        // Não falha o agendamento por erro de notificação — loga e continua
        console.error('Erro ao criar notificações:', notifErr.message)
      }
    }

    // ── Retorna sucesso ─────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        appointment_id: appointmentId,
        notifications_queued: notificationQueue.length,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    console.error('Erro inesperado:', err)
    return errorResponse('Erro interno do servidor', 500)
  }
})

// ─── Helper ───────────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
```

---

## PARTE 2 — ATUALIZAR O DASHBOARD

### `src/services/appointments.service.ts`

Substitua a função `createAppointment` existente por esta versão que chama a Edge Function:

```ts
// Cria agendamento via Edge Function (com validação de disponibilidade)
export async function createAppointment(payload: CreateAppointmentPayload) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autenticado')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const url = `${supabaseUrl}/functions/v1/create-appointment`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json() as {
    success: boolean
    appointment_id?: string
    notifications_queued?: number
    error?: string
  }

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? 'Erro ao criar agendamento')
  }

  return result
}
```

---

## PARTE 3 — DEPLOY DA EDGE FUNCTION

No terminal, dentro da pasta raiz do projeto:

```bash
# Instalar Supabase CLI se não tiver
npm install -g supabase

# Login
supabase login

# Deploy da função
supabase functions deploy create-appointment --project-ref <seu-project-ref>
```

O `project-ref` está na URL do Supabase Studio:
`https://supabase.com/dashboard/project/<project-ref>`

---

## PARTE 4 — VARIÁVEIS DE AMBIENTE NA EDGE FUNCTION

As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`
são **injetadas automaticamente** pelo Supabase em todas as Edge Functions.
Não é necessário configurar nada.

---

## VERIFICAÇÃO FINAL

- [ ] Pasta `supabase/functions/create-appointment/index.ts` criada
- [ ] Função deployada sem erros (`supabase functions deploy`)
- [ ] `appointments.service.ts` com a nova implementação de `createAppointment`
- [ ] Abrir modal de novo agendamento e criar um agendamento válido → toast de sucesso
- [ ] Tentar criar agendamento no mesmo horário de um existente → toast com mensagem de conflito
- [ ] Tentar criar agendamento no passado → toast de erro
- [ ] Verificar no Supabase Studio que o agendamento foi criado em `appointments`
- [ ] Verificar que as notificações foram criadas em `notification_queue`
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem warnings

### Como testar o conflito manualmente:
1. Criar um agendamento para Henrique às 14h (serviço de 60min → termina 15h)
2. Tentar criar outro agendamento para Henrique às 14h30
3. Deve receber: "Horário indisponível — o profissional já tem agendamento das 14:00 às 15:00"
