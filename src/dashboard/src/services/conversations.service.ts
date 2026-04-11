import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type SessionStatus = Database['public']['Enums']['session_status']

export interface ConversationSession {
  id: string
  session_id: string
  status: SessionStatus
  context_summary: string | null
  started_at: string
  last_message_at: string
  closed_at: string | null
  clients: {
    id: string
    name: string | null
    phone: string
    ia_status: string
  } | null
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  media_type: string | null
  media_url: string | null
  tokens_used: number | null
  created_at: string
}

export interface ConversationFilters {
  status?: SessionStatus | 'all'
  search?: string
}

// Lista de sessões com filtro
export async function getConversationSessions(
  filters: ConversationFilters = {},
): Promise<ConversationSession[]> {
  const { status, search } = filters

  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  let query = (supabase as any)
    .from('conversation_sessions')
    .select(
      `id, session_id, status, context_summary,
       started_at, last_message_at, closed_at,
       clients(id, name, phone, ia_status)`,
    )
    .order('last_message_at', { ascending: false })
    .limit(50)

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = (await query) as {
    data: ConversationSession[] | null
    error: { message: string } | null
  }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  if (error) throw new Error(error.message)

  let sessions = data ?? []

  if (search) {
    const q = search.toLowerCase()
    sessions = sessions.filter(
      (s) =>
        (s.clients?.name?.toLowerCase().includes(q) ?? false) ||
        (s.clients?.phone?.includes(q) ?? false),
    )
  }

  return sessions
}

// Mensagens de uma sessão
export async function getSessionMessages(
  sessionId: string,
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from('conversation_messages')
    .select(
      'id, role, content, media_type, media_url, tokens_used, created_at',
    )
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ConversationMessage[]
}

// Atualiza status da sessão (human takeover / reativar IA)
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
): Promise<void> {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const { error } = await (supabase as any)
    .from('conversation_sessions')
    .update({ status })
    .eq('id', sessionId)

  if (error) throw new Error((error as { message: string }).message)
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
}
