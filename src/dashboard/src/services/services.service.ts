import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Service = Database['public']['Tables']['services']['Row']

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)

  return data ?? []
}
