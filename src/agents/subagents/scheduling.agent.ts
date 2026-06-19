import type { Agent, AgentContext, AgentResult, Intent } from '../types'

export class SchedulingAgent implements Agent {
  name = 'scheduling'
  description = 'Cria e gerencia agendamentos via Google Calendar'

  canHandle(intent: Intent): boolean {
    return ['scheduling', 'cancel_scheduling'].includes(intent)
  }

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const isCancel = false

    const actions = [
      {
        type: 'create_event' as const,
        payload: {
          contactId: ctx.contactId,
          contactName: ctx.contactName ?? 'Cliente',
          summary: `Agendamento - ${ctx.contactName ?? 'Cliente'}`,
        },
      },
    ]

    return {
      success: true,
      data: {
        intent: isCancel ? 'cancelamento' : 'agendamento',
        status: 'pending_confirmation',
      },
      actions,
    }
  }
}
