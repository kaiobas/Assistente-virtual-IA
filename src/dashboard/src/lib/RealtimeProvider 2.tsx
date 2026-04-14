/**
 * RealtimeProvider
 *
 * Abre um canal Supabase Realtime por tabela (montado UMA vez, quando o
 * usuário está autenticado). Qualquer INSERT / UPDATE / DELETE em qualquer
 * tabela relevante invalida os query keys correspondentes, forçando refetch
 * automático em todos os componentes que consomem esses dados.
 */
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channels = [
      // Agendamentos → atualiza lista e métricas do dashboard
      supabase
        .channel('rt:appointments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPOINTMENTS] })
          void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        })
        .subscribe(),

      // Clientes
      supabase
        .channel('rt:clients')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] })
        })
        .subscribe(),

      // Profissionais
      supabase
        .channel('rt:professionals')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'professionals' }, () => {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFESSIONALS] })
        })
        .subscribe(),

      // Regras de disponibilidade
      supabase
        .channel('rt:availability_rules')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'availability_rules' }, () => {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFESSIONALS] })
        })
        .subscribe(),

      // Serviços
      supabase
        .channel('rt:services')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] })
        })
        .subscribe(),

      // Fila de notificações → atualiza queue, log e métricas
      supabase
        .channel('rt:notification_queue')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_queue' }, () => {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] })
        })
        .subscribe(),

      // Sessões de conversa → lista do painel de conversas
      supabase
        .channel('rt:conversation_sessions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_sessions' }, () => {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONVERSATIONS] })
        })
        .subscribe(),
    ]

    return () => {
      channels.forEach(ch => void supabase.removeChannel(ch))
    }
  }, [queryClient])

  return <>{children}</>
}
