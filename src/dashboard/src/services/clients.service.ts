import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type IaStatus = Database['public']['Enums']['ia_status_enum']

export interface ClientRow {
  id: string
  name: string | null
  phone: string
  email: string | null
  notes: string | null
  ia_status: IaStatus
  first_contact_at: string | null
  last_contact_at: string | null
  created_at: string
}

export interface ClientFilters {
  search?: string
  ia_status?: IaStatus | 'all'
  page?: number
  pageSize?: number
}

// ─── Tipos de retorno das buscas relacionadas ────────────────────────────────

export interface ClientAppointmentRow {
  id: string
  scheduled_at: string
  ends_at: string
  status: Database['public']['Enums']['appointment_status']
  source: string
  professionals: { display_name: string } | null
  services: { name: string; duration_min: number; price: number } | null
}

export interface ClientConversationRow {
  id: string
  status: 'active' | 'human_takeover' | 'closed'
  started_at: string
  last_message_at: string
  context_summary: string | null
}

// ─── Funções de leitura ──────────────────────────────────────────────────────

// Lista de clientes com busca e filtro
export async function getClients(filters: ClientFilters = {}) {
  const { search, ia_status, page = 1, pageSize = 30 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('clients')
    .select(
      'id, name, phone, email, notes, ia_status, first_contact_at, last_contact_at, created_at',
      { count: 'exact' }
    )
    .order('last_contact_at', { ascending: false, nullsFirst: false })
    .range(from, to)

  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  if (ia_status && ia_status !== 'all') query = query.eq('ia_status', ia_status)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as ClientRow[], count: count ?? 0 }
}

// Busca agendamentos do cliente
export async function getClientAppointments(clientId: string): Promise<ClientAppointmentRow[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, scheduled_at, ends_at, status, source,
      professionals(display_name),
      services(name, duration_min, price)
    `)
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: false })
    .limit(10)

  if (error) throw new Error(error.message)
  return (data ?? []) as ClientAppointmentRow[]
}

// Busca sessões de conversa do cliente
export async function getClientConversations(clientId: string): Promise<ClientConversationRow[]> {
  const { data, error } = await supabase
    .from('conversation_sessions')
    .select('id, status, started_at, last_message_at, context_summary')
    .eq('client_id', clientId)
    .order('last_message_at', { ascending: false })
    .limit(5)

  if (error) throw new Error(error.message)
  return (data ?? []) as ClientConversationRow[]
}

// ─── Mutações ────────────────────────────────────────────────────────────────

export interface UpdateClientPayload {
  name?: string
  email?: string
  notes?: string
  ia_status?: IaStatus
}

// Atualiza dados do cliente
export async function updateClient(id: string, payload: UpdateClientPayload): Promise<ClientRow> {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
  const { data, error } = await (supabase as any)
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select('id, name, phone, email, notes, ia_status, first_contact_at, last_contact_at, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data as ClientRow
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
}
