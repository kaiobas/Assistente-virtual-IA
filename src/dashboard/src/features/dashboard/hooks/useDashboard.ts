import { useQuery } from '@tanstack/react-query'
import {
  getDayMetrics,
  getAppointmentsChartData,
  getUpcomingAppointments,
} from '@/services/dashboard.service'

export function useDayMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'day-metrics'],
    queryFn: getDayMetrics,
  })
}

export function useAppointmentsChart(days: number) {
  return useQuery({
    queryKey: ['dashboard', 'chart', days],
    queryFn: () => getAppointmentsChartData(days),
  })
}

export function useUpcomingAppointments() {
  return useQuery({
    queryKey: ['dashboard', 'upcoming'],
    queryFn: getUpcomingAppointments,
  })
}
