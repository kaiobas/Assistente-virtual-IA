import { supabase } from '@/lib/supabase'

export interface Business {
  id: string
  name: string
  segment: string
  phone_number: string
  timezone: string
  agent_name: string
  agent_persona: string | null
  owner_name: string | null
  business_rules: Record<string, unknown>
  modules_enabled: Record<string, boolean>
  active: boolean
}

export interface UpdateBusinessPayload {
  name?: string
  segment?: string
  phone_number?: string
  timezone?: string
  agent_name?: string
  agent_persona?: string
  owner_name?: string
  business_rules?: Record<string, unknown>
}

export async function getBusiness(): Promise<Business> {
  const { data, error } = await supabase
    .from('business')
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Business
}

export async function updateBusiness(payload: UpdateBusinessPayload) {
  const { data: current } = await supabase.from('business').select('id').single()

  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const { data, error } = await (supabase as any)
    .from('business')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', (current as { id: string } | null)?.id ?? '')
    .select('*')
    .single() as { data: Business | null; error: { message: string } | null }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  if (error) throw new Error(error.message)
  return data as Business
}
