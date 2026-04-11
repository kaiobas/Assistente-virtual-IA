import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getServices,
  createService,
  updateService,
  toggleServiceActive,
  type UpsertServicePayload,
} from '@/services/services.service'

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
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] }) },
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UpsertServicePayload> }) =>
      updateService(id, payload),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] }) },
  })
}

export function useToggleServiceActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleServiceActive(id, active),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] }) },
  })
}
