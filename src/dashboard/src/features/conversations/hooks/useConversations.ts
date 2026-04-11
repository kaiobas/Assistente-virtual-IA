import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getConversationSessions,
  getSessionMessages,
  updateSessionStatus,
  type ConversationFilters,
  type SessionStatus,
} from '@/services/conversations.service'

export function useConversationSessions(filters: ConversationFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, filters],
    queryFn: () => getConversationSessions(filters),
    // Atualiza a cada 30s — conversas mudam com frequência
    refetchInterval: 1000 * 30,
  })
}

export function useSessionMessages(sessionId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, sessionId, 'messages'],
    queryFn: () => getSessionMessages(sessionId!),
    enabled: !!sessionId,
    // Atualiza a cada 10s quando uma sessão está aberta
    refetchInterval: 1000 * 10,
  })
}

export function useUpdateSessionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      status,
    }: {
      sessionId: string
      status: SessionStatus
    }) => updateSessionStatus(sessionId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS],
      })
    },
  })
}
