import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type AppointmentStatus = Database['public']['Enums']['appointment_status']

export interface AppointmentFilters {
  status?: AppointmentStatus
  dateFrom?: string
  dateTo?: string
  professionalId?: string
  page?: number
  pageSize?: number
}

export interface AppointmentRow {
  id: string
  scheduled_at: string
  ends_at: string
  status: AppointmentStatus
  source: string
  notes: string | null
  cancelled_reason: string | null
  created_at: string
  clients: { id: string; name: string | null; phone: string } | null
  professionals: { id: string; display_name: string; specialty: string | null } | null
  services: { id: string; name: string; duration_min: number; price: number } | null
}

// Busca agendamentos com filtros e paginação
export async function getAppointments(filters: AppointmentFilters = {}) {
  const { status, dateFrom, dateTo, professionalId, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('appointments')
    .select(
      `id, scheduled_at, ends_at, status, source, notes, cancelled_reason, created_at,
       clients(id, name, phone),
       professionals(id, display_name, specialty),
       services(id, name, duration_min, price)`,
      { count: 'exact' }
    )
    .order('scheduled_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (dateFrom) query = query.gte('scheduled_at', dateFrom)
  if (dateTo) query = query.lte('scheduled_at', dateTo)
  if (professionalId) query = query.eq('professional_id', professionalId)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as AppointmentRow[], count: count ?? 0 }
}

export interface CalendarAppointment {
  id: string
  scheduled_at: string
  ends_at: string
  status: string
  clients: { name: string | null; phone: string } | null
  professionals: { display_name: string } | null
  services: { name: string; duration_min: number } | null
}

// Busca agendamentos de um intervalo de datas para o calendário
export async function getAppointmentsByDateRange(
  dateFrom: string,
  dateTo: string
): Promise<CalendarAppointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `id, scheduled_at, ends_at, status,
       clients(name, phone),
       professionals(display_name),
       services(name, duration_min)`
    )
    .gte('scheduled_at', dateFrom)
    .lte('scheduled_at', dateTo)
    .not('status', 'in', '("cancelled_by_client","cancelled_by_business","cancelled_auto")')
    .order('scheduled_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as CalendarAppointment[]
}

export interface CreateAppointmentPayload {
  client_id: string
  professional_id: string
  service_id: string
  scheduled_at: string
  notes?: string
}

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

// Atualiza status de um agendamento
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  reason?: string
) {
  const update: Record<string, unknown> = { status }
  if (reason) update.cancelled_reason = reason

  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
  const { error } = await (supabase as any).from('appointments').update(update).eq('id', id)
  if (error) throw new Error(error.message)
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
}

// ─── Tipos de opções para selects ──────────────────────────────────────────
export interface ProfessionalOption {
  id: string
  display_name: string
  specialty: string | null
}

export interface ServiceOption {
  id: string
  name: string
  duration_min: number
  price: number
  category: string | null
}

export interface ClientOption {
  id: string
  name: string | null
  phone: string
}

// Busca profissionais para os selects do formulário
export async function getProfessionals(): Promise<ProfessionalOption[]> {
  const { data, error } = await supabase
    .from('professionals')
    .select('id, display_name, specialty')
    .eq('active', true)
    .order('display_name')

  if (error) throw new Error(error.message)
  return (data ?? []) as ProfessionalOption[]
}

// Busca serviços para os selects do formulário
export async function getServices(): Promise<ServiceOption[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, duration_min, price, category')
    .eq('active', true)
    .order('category')

  if (error) throw new Error(error.message)
  return (data ?? []) as ServiceOption[]
}

// Busca clientes para o combobox de busca
export async function searchClients(query: string): Promise<ClientOption[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10)

  if (error) throw new Error(error.message)
  return (data ?? []) as ClientOption[]
}
