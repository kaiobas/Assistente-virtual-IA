import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import type { PaginatedResponse, DateRangeFilter, PaginationParams } from '@/types'

type Appointment = Database['public']['Tables']['appointments']['Row']
type AppointmentWithRelations = Appointment & {
  clients: Pick<Database['public']['Tables']['clients']['Row'], 'name' | 'phone'>
  professionals: Pick<Database['public']['Tables']['professionals']['Row'], 'name'>
  services: Pick<
    Database['public']['Tables']['services']['Row'],
    'name' | 'duration_min' | 'price'
  >
}

interface GetAppointmentsParams extends PaginationParams {
  status?: Appointment['status']
  dateRange?: DateRangeFilter
}

export async function getAppointments(
  params: GetAppointmentsParams
): Promise<PaginatedResponse<AppointmentWithRelations>> {
  const { page, pageSize, status, dateRange } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('appointments')
    .select('*, clients(name, phone), professionals(name), services(name, duration_min, price)', {
      count: 'exact',
    })
    .order('scheduled_at', { ascending: true })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (dateRange) query = query.gte('scheduled_at', dateRange.from).lte('scheduled_at', dateRange.to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: data as AppointmentWithRelations[],
    count: count ?? 0,
    page,
    pageSize,
  }
}
