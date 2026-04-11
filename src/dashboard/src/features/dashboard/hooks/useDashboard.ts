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
    // Atualiza a cada 2 minutos automaticamente
    refetchInterval: 1000 * 60 * 2,
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
    refetchInterval: 1000 * 60 * 2,
  })
}
