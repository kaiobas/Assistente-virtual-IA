import type { Agent, AgentContext, AgentResult, Intent } from '../types'

export class RAGAgent implements Agent {
  name = 'rag'
  description = 'Busca contexto vetorial e histórico no Prisma/Supabase'

  canHandle(_intent: Intent): boolean {
    return true
  }

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const actions = [
      {
        type: 'search_rag' as const,
        payload: {
          conversationId: ctx.conversationId,
          query: ctx.message,
        },
      },
      {
        type: 'store_context' as const,
        payload: {
          conversationId: ctx.conversationId,
          content: ctx.message,
          role: 'user',
        },
      },
    ]

    return {
      success: true,
      actions,
    }
  }
}
