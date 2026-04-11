import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { getAppointments } from '@/services/appointments.service'
import type { Database } from '@/types/database.types'
import type { DateRangeFilter } from '@/types'

type AppointmentStatus = Database['public']['Tables']['appointments']['Row']['status']

interface UseAppointmentsParams {
  page?: number
  pageSize?: number
  status?: AppointmentStatus
  dateRange?: DateRangeFilter
}

export function useAppointments({
  page = 1,
  pageSize = 20,
  status,
  dateRange,
}: UseAppointmentsParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.APPOINTMENTS, { page, pageSize, status, dateRange }],
    queryFn: () => getAppointments({ page, pageSize, status, dateRange }),
  })
}
