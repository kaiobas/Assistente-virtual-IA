import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getAppointments,
  getAppointmentsByDateRange,
  createAppointment,
  updateAppointmentStatus,
  getProfessionals,
  getServices,
  searchClients,
  type AppointmentFilters,
  type AppointmentStatus,
  type CreateAppointmentPayload,
} from '@/services/appointments.service'
import { toast } from 'sonner'

export function useAppointments(filters: AppointmentFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.APPOINTMENTS, filters],
    queryFn: () => getAppointments(filters),
  })
}

export function useAppointmentsByDateRange(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.APPOINTMENTS, 'calendar', dateFrom, dateTo],
    queryFn: () => getAppointmentsByDateRange(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => createAppointment(payload),
    onSuccess: () => {
      toast.success('Agendamento criado com sucesso')
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPOINTMENTS] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar agendamento')
    },
  })
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string
      status: AppointmentStatus
      reason?: string
    }) => updateAppointmentStatus(id, status, reason),
    onSuccess: () => {
      toast.success('Status atualizado')
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPOINTMENTS] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status')
    },
  })
}

export function useProfessionals() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFESSIONALS],
    queryFn: getProfessionals,
    staleTime: 1000 * 60 * 10,
  })
}

export function useServices() {
  return useQuery({
    queryKey: [QUERY_KEYS.SERVICES],
    queryFn: getServices,
    staleTime: 1000 * 60 * 10,
  })
}

export function useSearchClients(query: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENTS, 'search', query],
    queryFn: () => searchClients(query),
    enabled: query.length >= 2,
  })
}
