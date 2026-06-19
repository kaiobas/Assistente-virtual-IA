import type { Agent, AgentContext, AgentResult, Intent } from '../types'

export class DashboardAgent implements Agent {
  name = 'dashboard'
  description = 'Fornece dados e métricas para o dashboard'

  canHandle(_intent: Intent): boolean {
    return false
  }

  async execute(ctx: AgentContext): Promise<AgentResult> {
    return {
      success: true,
      data: {
        type: 'dashboard_data',
        conversationId: ctx.conversationId,
      },
    }
  }
}
