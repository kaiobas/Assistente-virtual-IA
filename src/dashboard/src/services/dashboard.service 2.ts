import { supabase } from '@/lib/supabase'

// Intervalo de datas para hoje (início e fim do dia em UTC)
function getTodayRange() {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

export interface DayMetrics {
  appointmentsTotal: number
  appointmentsConfirmed: number
  appointmentsPending: number
  appointmentsCancelled: number
  newClients: number
  activeConversations: number
}

// Busca métricas do dia atual
export async function getDayMetrics(): Promise<DayMetrics> {
  const { start, end } = getTodayRange()

  const [appointments, newClients, activeConversations] = await Promise.all([
    supabase
      .from('appointments')
      .select('status')
      .gte('scheduled_at', start)
      .lte('scheduled_at', end),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .gte('first_contact_at', start)
      .lte('first_contact_at', end),
    supabase
      .from('conversation_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const appts = (appointments.data ?? []) as Array<{ status: string }>

  return {
    appointmentsTotal: appts.length,
    appointmentsConfirmed: appts.filter((a) => a.status === 'confirmed').length,
    appointmentsPending: appts.filter((a) => a.status === 'pending').length,
    appointmentsCancelled: appts.filter((a) =>
      ['cancelled_by_client', 'cancelled_by_business', 'cancelled_auto'].includes(a.status)
    ).length,
    newClients: newClients.count ?? 0,
    activeConversations: activeConversations.count ?? 0,
  }
}

export interface ChartDataPoint {
  date: string   // "DD/MM"
  confirmed: number
  cancelled: number
  completed: number
}

// Busca agendamentos dos últimos N dias para o gráfico
export async function getAppointmentsChartData(days = 7): Promise<ChartDataPoint[]> {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('appointments')
    .select('scheduled_at, status')
    .gte('scheduled_at', start.toISOString())
    .lte('scheduled_at', end.toISOString())

  // Agrupa por dia
  const map = new Map<string, ChartDataPoint>()

  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    map.set(key, { date: key, confirmed: 0, cancelled: 0, completed: 0 })
  }

  for (const appt of (data ?? []) as Array<{ scheduled_at: string; status: string }>) {
    const d = new Date(appt.scheduled_at)
    const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const entry = map.get(key)
    if (!entry) continue
    if (appt.status === 'confirmed') entry.confirmed++
    else if (appt.status === 'completed') entry.completed++
    else if (['cancelled_by_client', 'cancelled_by_business', 'cancelled_auto'].includes(appt.status))
      entry.cancelled++
  }

  return Array.from(map.values())
}

export interface UpcomingAppointment {
  id: string
  scheduled_at: string
  ends_at: string
  status: string
  clients: { name: string | null; phone: string } | null
  professionals: { display_name: string } | null
  services: { name: string; duration_min: number } | null
}

// Busca próximos agendamentos do dia (a partir de agora)
export async function getUpcomingAppointments(limit = 8): Promise<UpcomingAppointment[]> {
  const now = new Date().toISOString()
  const { end } = getTodayRange()

  const { data } = await supabase
    .from('appointments')
    .select(`
      id, scheduled_at, ends_at, status,
      clients(name, phone),
      professionals(display_name),
      services(name, duration_min)
    `)
    .gte('scheduled_at', now)
    .lte('scheduled_at', end)
    .in('status', ['pending', 'confirmed'])
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  return (data ?? []) as UpcomingAppointment[]
}
