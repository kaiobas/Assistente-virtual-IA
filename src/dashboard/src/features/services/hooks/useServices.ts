import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getServices,
  createService,
  updateService,
  toggleServiceActive,
  type UpsertServicePayload,
} from '@/services/services.service'
import { toast } from 'sonner'

export function useServices() {
  return useQuery({
    queryKey: [QUERY_KEYS.SERVICES],
    queryFn: getServices,
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertServicePayload) => createService(payload),
    onSuccess: () => {
      toast.success('Serviço criado com sucesso')
      void qc.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar serviço')
    },
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UpsertServicePayload> }) =>
      updateService(id, payload),
    onSuccess: () => {
      toast.success('Serviço atualizado')
      void qc.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar serviço')
    },
  })
}

export function useToggleServiceActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleServiceActive(id, active),
    onSuccess: (_data, vars) => {
      toast.success(vars.active ? 'Serviço ativado' : 'Serviço desativado')
      void qc.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao alterar status do serviço')
    },
  })
}
