import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import type { PaginatedResponse, PaginationParams } from '@/types'

type Conversation = Database['public']['Tables']['conversations']['Row']

interface GetConversationsParams extends PaginationParams {
  status?: Conversation['status']
}

export async function getConversations(
  params: GetConversationsParams
): Promise<PaginatedResponse<Conversation>> {
  const { page, pageSize, status } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .order('last_message_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return { data: data ?? [], count: count ?? 0, page, pageSize }
}
