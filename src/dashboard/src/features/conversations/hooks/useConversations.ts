import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import {
  getConversationSessions,
  getSessionMessages,
  updateSessionStatus,
  type ConversationFilters,
  type SessionStatus,
} from '@/services/conversations.service'

// Lista de sessões — Realtime via RealtimeProvider (rt:conversation_sessions)
export function useConversationSessions(filters: ConversationFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, filters],
    queryFn: () => getConversationSessions(filters),
  })
}

// Mensagens da sessão — Realtime via WebSocket
export function useSessionMessages(sessionId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = [QUERY_KEYS.CONVERSATIONS, sessionId, 'messages']

  // Carga inicial via TanStack Query
  const query = useQuery({
    queryKey,
    queryFn: () => getSessionMessages(sessionId!),
    enabled: !!sessionId,
    // Sem polling — o Realtime cuida das atualizações
    refetchInterval: false,
  })

  // Subscription Realtime — escuta INSERTs em conversation_messages
  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          // Filtra apenas mensagens da sessão aberta
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Invalida a query para refetch ao receber nova mensagem
          void queryClient.invalidateQueries({ queryKey })
        }
      )
      .subscribe()

    // Cleanup: cancela a subscription ao fechar a sessão ou desmontar
    return () => {
      void supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, queryClient])

  return query
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
    onSuccess: (_data, vars) => {
      const msg =
        vars.status === 'human_takeover'
          ? 'Atendimento assumido — IA pausada'
          : vars.status === 'active'
          ? 'IA reativada com sucesso'
          : 'Status atualizado'
      toast.success(msg)
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS],
      })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar conversa')
    },
  })
}

