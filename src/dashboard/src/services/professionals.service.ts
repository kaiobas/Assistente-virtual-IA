import { supabase } from '@/lib/supabase'

export interface Professional {
  id: string
  name: string
  display_name: string
  specialty: string | null
  avatar_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface AvailabilityRule {
  id: string
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

export interface UpsertProfessionalPayload {
  name: string
  display_name: string
  specialty?: string
}

export interface UpsertRulePayload {
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export async function getProfessionals(): Promise<Professional[]> {
  const { data, error } = await supabase
    .from('professionals')
    .select(
      'id, name, display_name, specialty, avatar_url, active, created_at, updated_at',
    )
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Professional[]
}

export async function getAvailabilityRules(
  professionalId: string,
): Promise<AvailabilityRule[]> {
  const { data, error } = await supabase
    .from('availability_rules')
    .select('id, professional_id, day_of_week, start_time, end_time, active')
    .eq('professional_id', professionalId)
    .order('day_of_week')
    .order('start_time')

  if (error) throw new Error(error.message)
  return (data ?? []) as AvailabilityRule[]
}

export async function createProfessional(
  payload: UpsertProfessionalPayload,
): Promise<Professional> {
  const { data: business } = await supabase
    .from('business')
    .select('id')
    .single()

  if (!business) throw new Error('Negócio não encontrado')

  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const { data, error } = await (supabase as any)
    .from('professionals')
    .insert({ ...payload, business_id: (business as any).id })
    .select(
      'id, name, display_name, specialty, avatar_url, active, created_at, updated_at',
    )
    .single() as { data: Professional | null; error: { message: string } | null }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  if (error) throw new Error(error.message)
  return data as Professional
}

export async function updateProfessional(
  id: string,
  payload: Partial<UpsertProfessionalPayload> & { active?: boolean },
): Promise<Professional> {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const { data, error } = await (supabase as any)
    .from('professionals')
    .update(payload)
    .eq('id', id)
    .select(
      'id, name, display_name, specialty, avatar_url, active, created_at, updated_at',
    )
    .single() as { data: Professional | null; error: { message: string } | null }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  if (error) throw new Error(error.message)
  return data as Professional
}

export async function addAvailabilityRule(
  payload: UpsertRulePayload,
): Promise<AvailabilityRule> {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const { data, error } = await (supabase as any)
    .from('availability_rules')
    .insert(payload)
    .select('id, professional_id, day_of_week, start_time, end_time, active')
    .single() as { data: AvailabilityRule | null; error: { message: string } | null }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  if (error) throw new Error(error.message)
  return data as AvailabilityRule
}

export async function deleteAvailabilityRule(ruleId: string): Promise<void> {
  const { error } = await supabase
    .from('availability_rules')
    .delete()
    .eq('id', ruleId)

  if (error) throw new Error(error.message)
}

export async function updateAvailabilityRule(
  ruleId: string,
  payload: { start_time: string; end_time: string },
): Promise<AvailabilityRule> {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const { data, error } = await (supabase as any)
    .from('availability_rules')
    .update(payload)
    .eq('id', ruleId)
    .select('id, professional_id, day_of_week, start_time, end_time, active')
    .single() as { data: AvailabilityRule | null; error: { message: string } | null }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  if (error) throw new Error(error.message)
  return data as AvailabilityRule
}
