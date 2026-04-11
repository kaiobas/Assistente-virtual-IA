import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Professional = Database['public']['Tables']['professionals']['Row']

export async function getProfessionals(): Promise<Professional[]> {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)

  return data ?? []
}
