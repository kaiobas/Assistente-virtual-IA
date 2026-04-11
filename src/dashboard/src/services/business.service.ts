import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Business = Database['public']['Tables']['business']['Row']

export async function getBusiness(businessId: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('business')
    .select('*')
    .eq('id', businessId)
    .single()

  if (error) throw new Error(error.message)

  return data
}
