import type { Agent, AgentContext, AgentResult, Intent } from '../types'

export class NotificationAgent implements Agent {
  name = 'notification'
  description = 'Dispara notificações e lembretes'

  canHandle(_intent: Intent): boolean {
    return false
  }

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const actions = [
      {
        type: 'notify' as const,
        payload: {
          conversationId: ctx.conversationId,
          contactId: ctx.contactId,
          event: 'message_received',
        },
      },
    ]

    return {
      success: true,
      actions,
    }
  }
}
