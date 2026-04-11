import { supabase } from '@/lib/supabase'

export interface NotificationQueueItem {
  id: string
  type: string
  send_at: string
  status: string
  expires_at: string | null
  attempts: number
  created_at: string
  clients: { name: string | null; phone: string } | null
  appointments: {
    scheduled_at: string
    services: { name: string } | null
  } | null
}

export interface NotificationLogItem {
  id: string
  queue_id: string
  channel: string
  message_body: string
  sent_at: string
  delivery_status: string
  error_message: string | null
  appointments: {
    scheduled_at: string
    clients: { name: string | null; phone: string } | null
    services: { name: string } | null
  } | null
}

export interface NotificationFilters {
  status?: string
  type?: string
  page?: number
  pageSize?: number
}

export async function getNotificationQueue(filters: NotificationFilters = {}) {
  const { status, type, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('notification_queue')
    .select(
      `id, type, send_at, status, expires_at, attempts, created_at,
       clients(name, phone),
       appointments(scheduled_at, services(name))`,
      { count: 'exact' },
    )
    .order('send_at', { ascending: true })
    .range(from, to)

  if (status && status !== 'all') query = query.eq('status', status)
  if (type && type !== 'all') query = query.eq('type', type)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as NotificationQueueItem[], count: count ?? 0 }
}

export async function getNotificationLog(filters: NotificationFilters = {}) {
  const { page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('notification_log')
    .select(
      `id, queue_id, channel, message_body, sent_at, delivery_status, error_message,
       appointments(scheduled_at, clients(name, phone), services(name))`,
      { count: 'exact' },
    )
    .order('sent_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)

  return { data: (data ?? []) as NotificationLogItem[], count: count ?? 0 }
}

export async function cancelNotification(id: string) {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const { error } = await (supabase as any)
    .from('notification_queue')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'pending') as { error: { message: string } | null }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  if (error) throw new Error(error.message)
}

export async function getNotificationMetrics() {
  const [pending, sent, failed] = await Promise.all([
    supabase
      .from('notification_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('notification_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent'),
    supabase
      .from('notification_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed'),
  ])

  return {
    pending: pending.count ?? 0,
    sent: sent.count ?? 0,
    failed: failed.count ?? 0,
  }
}

// --- Configurações de notificação ---

export interface NotificationSetting {
  id: string
  type: string
  enabled: boolean
  advance_hours: number
}

export async function getNotificationSettings(): Promise<NotificationSetting[]> {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('id, type, enabled, advance_hours')
    .order('type')

  if (error) throw new Error(error.message)
  return (data ?? []) as NotificationSetting[]
}

export async function updateNotificationSetting(
  id: string,
  payload: { enabled?: boolean; advance_hours?: number },
) {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const { data, error } = await (supabase as any)
    .from('notification_settings')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, type, enabled, advance_hours')
    .single() as { data: NotificationSetting | null; error: { message: string } | null }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  if (error) throw new Error(error.message)
  return data as NotificationSetting
}
