import { supabase } from '@/lib/supabase'

export interface Service {
  id: string
  name: string
  description: string | null
  duration_min: number
  price: number
  category: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface UpsertServicePayload {
  name: string
  description?: string
  duration_min: number
  price: number
  category?: string
  active?: boolean
}

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, duration_min, price, category, active, created_at, updated_at')
    .order('category')
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Service[]
}

export async function createService(payload: UpsertServicePayload): Promise<Service> {
  const { data: business } = await supabase.from('business').select('id').single()

  if (!business) throw new Error('Negócio não encontrado')

  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const { data, error } = await (supabase as any)
    .from('services')
    .insert({ ...payload, business_id: (business as any).id, active: payload.active ?? true })
    .select('id, name, description, duration_min, price, category, active, created_at, updated_at')
    .single() as { data: Service | null; error: { message: string } | null }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  if (error) throw new Error(error.message)
  return data as Service
}

export async function updateService(
  id: string,
  payload: Partial<UpsertServicePayload>,
): Promise<Service> {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const { data, error } = await (supabase as any)
    .from('services')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, description, duration_min, price, category, active, created_at, updated_at')
    .single() as { data: Service | null; error: { message: string } | null }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  if (error) throw new Error(error.message)
  return data as Service
}

export async function toggleServiceActive(id: string, active: boolean): Promise<void> {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const { error } = await (supabase as any)
    .from('services')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id) as { data: null; error: { message: string } | null }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  if (error) throw new Error(error.message)
}
