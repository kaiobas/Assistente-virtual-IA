import type { Agent, AgentContext, AgentResult, Intent } from '../types'

export class WhatsAppAgent implements Agent {
  name = 'whatsapp'
  description = 'Gerencia envio/recebimento de mensagens via Evolution API'

  canHandle(intent: Intent): boolean {
    return ['greeting', 'question', 'unknown'].includes(intent)
  }

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const actions = [
      {
        type: 'send_message' as const,
        payload: {
          to: ctx.contactId,
          message: ctx.message,
        },
      },
    ]

    return {
      success: true,
      actions,
    }
  }
}
