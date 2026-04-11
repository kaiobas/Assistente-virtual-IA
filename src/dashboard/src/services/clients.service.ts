import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import type { PaginatedResponse, PaginationParams } from '@/types'

type Client = Database['public']['Tables']['clients']['Row']

interface GetClientsParams extends PaginationParams {
  search?: string
}

export async function getClients(
  params: GetClientsParams
): Promise<PaginatedResponse<Client>> {
  const { page, pageSize, search } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to)

  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return { data: data ?? [], count: count ?? 0, page, pageSize }
}
