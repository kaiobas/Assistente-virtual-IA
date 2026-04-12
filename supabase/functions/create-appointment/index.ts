// @ts-nocheck — Deno Edge Function: not checked by Node TypeScript
// deno-lint-ignore-file
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CreateAppointmentBody {
  client_id: string
  professional_id: string
  service_id: string
  scheduled_at: string // ISO 8601
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
    const body = (await req.json()) as CreateAppointmentBody
    const { client_id, professional_id, service_id, scheduled_at, notes } = body

    // ── Validação básica ────────────────────────────────────────────────────
    if (!client_id || !professional_id || !service_id || !scheduled_at) {
      return errorResponse(
        'Campos obrigatórios: client_id, professional_id, service_id, scheduled_at',
        400
      )
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

    const endsAt = new Date(
      scheduledAtDate.getTime() + (service as { duration_min: number; name: string }).duration_min * 60 * 1000
    )

    // ── Verifica sobreposição de horário ────────────────────────────────────
    const { data: overlapping } = await supabase
      .from('appointments')
      .select('id, scheduled_at, ends_at')
      .eq('professional_id', professional_id)
      .not(
        'status',
        'in',
        '(cancelled_by_client,cancelled_by_business,cancelled_auto,no_show)'
      )
      .lt('scheduled_at', endsAt.toISOString())
      .gt('ends_at', scheduledAtDate.toISOString())

    if (overlapping && overlapping.length > 0) {
      const conflict = overlapping[0] as { scheduled_at: string; ends_at: string }
      return errorResponse(
        `Horário indisponível — o profissional já tem agendamento das ` +
          `${new Date(conflict.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ` +
          `às ${new Date(conflict.ends_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        409
      )
    }

    // ── Busca business_id do usuário ────────────────────────────────────────
    const { data: businessUser } = await supabase
      .from('business_users')
      .select('business_id')
      .single()

    if (!businessUser) return errorResponse('Negócio não encontrado', 404)
    const businessId = (businessUser as { business_id: string }).business_id

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
      return errorResponse(`Erro ao criar agendamento: ${apptErr?.message ?? 'desconhecido'}`, 500)
    }

    const appointmentId = (appointment as { id: string }).id

    // ── Cria notificações na fila ───────────────────────────────────────────
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

      let sendAt: Date

      if (setting.type === 'booking_created' || setting.type === 'booking_confirmed') {
        sendAt = new Date()
      } else if (
        setting.type === 'confirmation_request' ||
        setting.type === 'reminder_d1' ||
        setting.type === 'reminder_h2'
      ) {
        sendAt = new Date(
          scheduledAtDate.getTime() - setting.advance_hours * 60 * 60 * 1000
        )
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

    if (notificationQueue.length > 0) {
      const { error: notifErr } = await admin
        .from('notification_queue')
        .insert(notificationQueue)

      if (notifErr) {
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
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
