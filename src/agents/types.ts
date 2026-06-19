export interface AgentContext {
  conversationId: string
  message: string
  mediaUrl?: string
  contactId: string
  contactName?: string
  businessId?: string
}

export interface AgentResult {
  success: boolean
  response?: string
  data?: unknown
  error?: string
  actions?: AgentAction[]
}

export interface AgentAction {
  type: 'send_message' | 'create_event' | 'notify' | 'transcribe' | 'search_rag' | 'store_context'
  payload: Record<string, unknown>
}

export type Intent =
  | 'greeting'
  | 'question'
  | 'scheduling'
  | 'cancel_scheduling'
  | 'complaint'
  | 'audio'
  | 'unknown'

export interface Agent {
  name: string
  description: string
  canHandle(intent: Intent): boolean
  execute(ctx: AgentContext): Promise<AgentResult>
}
