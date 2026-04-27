import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import {
  getNotificationQueue,
  getNotificationLog,
  cancelNotification,
  dispatchNotification,
  getNotificationMetrics,
  getNotificationSettings,
  updateNotificationSetting,
  type NotificationFilters,
} from '@/services/notifications.service'
import { toast } from 'sonner'

export function useNotificationMetrics() {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, 'metrics'],
    queryFn: getNotificationMetrics,
  })
}

export function useNotificationQueue(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, 'queue', filters],
    queryFn: () => getNotificationQueue(filters),
  })
}

export function useNotificationLog(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, 'log', filters],
    queryFn: () => getNotificationLog(filters),
  })
}

export function useCancelNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelNotification(id),
    onSuccess: () => {
      toast.success('Notificação cancelada')
      void qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cancelar notificação')
    },
  })
}

export function useDispatchNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dispatchNotification(id),
    onSuccess: () => {
      toast.success('Notificação disparada com sucesso!')
      void qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao disparar notificação')
    },
  })
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, 'settings'],
    queryFn: getNotificationSettings,
  })
}

export function useUpdateNotificationSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: { enabled?: boolean; advance_hours?: number }
    }) => updateNotificationSetting(id, payload),
    onSuccess: () => {
      toast.success('Configuração salva')
      void qc.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS, 'settings'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar configuração')
    },
  })
}
