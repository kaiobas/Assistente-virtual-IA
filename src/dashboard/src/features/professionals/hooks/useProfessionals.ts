import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getProfessionals,
  getAvailabilityRules,
  createProfessional,
  updateProfessional,
  addAvailabilityRule,
  deleteAvailabilityRule,
  updateAvailabilityRule,
  type UpsertProfessionalPayload,
  type UpsertRulePayload,
} from '@/services/professionals.service'
import { toast } from 'sonner'

export function useProfessionals() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFESSIONALS],
    queryFn: getProfessionals,
  })
}

export function useAvailabilityRules(professionalId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFESSIONALS, professionalId, 'rules'],
    queryFn: () => getAvailabilityRules(professionalId!),
    enabled: !!professionalId,
  })
}

export function useCreateProfessional() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertProfessionalPayload) =>
      createProfessional(payload),
    onSuccess: () => {
      toast.success('Profissional criado com sucesso')
      void qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROFESSIONALS] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar profissional')
    },
  })
}

export function useUpdateProfessional() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Parameters<typeof updateProfessional>[1]
    }) => updateProfessional(id, payload),
    onSuccess: () => {
      toast.success('Dados atualizados')
      void qc.invalidateQueries({ queryKey: [QUERY_KEYS.PROFESSIONALS] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar profissional')
    },
  })
}

export function useAddAvailabilityRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertRulePayload) => addAvailabilityRule(payload),
    onSuccess: (_data, vars) => {
      toast.success('Turno adicionado')
      void qc.invalidateQueries({
        queryKey: [
          QUERY_KEYS.PROFESSIONALS,
          vars.professional_id,
          'rules',
        ],
      })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao adicionar turno')
    },
  })
}

export function useDeleteAvailabilityRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ruleId,
    }: {
      ruleId: string
      professionalId: string
    }) => deleteAvailabilityRule(ruleId),
    onSuccess: (_data, vars) => {
      toast.success('Turno removido')
      void qc.invalidateQueries({
        queryKey: [
          QUERY_KEYS.PROFESSIONALS,
          vars.professionalId,
          'rules',
        ],
      })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover turno')
    },
  })
}

export function useUpdateAvailabilityRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ruleId,
      payload,
    }: {
      ruleId: string
      professionalId: string
      payload: { start_time: string; end_time: string }
    }) => updateAvailabilityRule(ruleId, payload),
    onSuccess: (_data, vars) => {
      toast.success('Horário atualizado')
      void qc.invalidateQueries({
        queryKey: [
          QUERY_KEYS.PROFESSIONALS,
          vars.professionalId,
          'rules',
        ],
      })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar horário')
    },
  })
}
