import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getClients,
  getClientAppointments,
  getClientConversations,
  updateClient,
  type ClientFilters,
  type UpdateClientPayload,
} from '@/services/clients.service'
import { toast } from 'sonner'

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENTS, filters],
    queryFn: () => getClients(filters),
  })
}

export function useClientAppointments(clientId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENTS, clientId, 'appointments'],
    queryFn: () => getClientAppointments(clientId!),
    enabled: !!clientId,
  })
}

export function useClientConversations(clientId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.CLIENTS, clientId, 'conversations'],
    queryFn: () => getClientConversations(clientId!),
    enabled: !!clientId,
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClientPayload }) =>
      updateClient(id, payload),
    onSuccess: () => {
      toast.success('Cliente atualizado')
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar cliente')
    },
  })
}
