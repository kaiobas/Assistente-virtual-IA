import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { getBusiness, updateBusiness, type UpdateBusinessPayload } from '@/services/business.service'

export function useBusiness() {
  return useQuery({
    queryKey: [QUERY_KEYS.BUSINESS],
    queryFn: getBusiness,
  })
}

export function useUpdateBusiness() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateBusinessPayload) => updateBusiness(payload),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: [QUERY_KEYS.BUSINESS] }) },
  })
}
