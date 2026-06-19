import type { Agent, AgentContext, AgentResult, Intent } from './types'
import { WhatsAppAgent } from './subagents/whatsapp.agent'
import { RAGAgent } from './subagents/rag.agent'
import { AIAgent } from './subagents/ai.agent'
import { SchedulingAgent } from './subagents/scheduling.agent'
import { DashboardAgent } from './subagents/dashboard.agent'
import { NotificationAgent } from './subagents/notification.agent'

export class AgentOrchestrator {
  private agents: Agent[] = []

  constructor() {
    this.register(new WhatsAppAgent())
    this.register(new RAGAgent())
    this.register(new AIAgent())
    this.register(new SchedulingAgent())
    this.register(new DashboardAgent())
    this.register(new NotificationAgent())
  }

  register(agent: Agent): void {
    this.agents.push(agent)
  }

  detectIntent(message: string): Intent {
    const lower = message.toLowerCase()

    if (/^(ol[áa]|oi|bom dia|boa tarde|boa noite|hey|iae)/.test(lower)) {
      return 'greeting'
    }
    if (/(agendar|marcar|hor[áa]rio|disponibilidade|quero|agenda)/.test(lower)) {
      return 'scheduling'
    }
    if (/(cancelar|desmarcar|cancelamento)/.test(lower)) {
      return 'cancel_scheduling'
    }
    if (/(reclama[çc][ãa]o|problema|erro|n[ãa]o funcionou|péssimo|ruim)/.test(lower)) {
      return 'complaint'
    }
    if (/(como|o que|quem|qual|onde|por que|quanto|pode|ajuda|d[uú]vida)/.test(lower)) {
      return 'question'
    }
    return 'unknown'
  }

  private async executeAgent(
    agent: Agent,
    ctx: AgentContext,
    intent: Intent,
  ): Promise<AgentResult | null> {
    if (!agent.canHandle(intent)) return null

    try {
      return await agent.execute(ctx)
    } catch (err) {
      return {
        success: false,
        error: `${agent.name}: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  }

  async process(ctx: AgentContext): Promise<{
    intent: Intent
    results: AgentResult[]
    response: string
  }> {
    const intent = this.detectIntent(ctx.message)

    const results: AgentResult[] = []

    const rabResult = await this.executeAgent(
      this.agents.find(a => a.name === 'rag')!,
      ctx,
      intent,
    )
    if (rabResult) results.push(rabResult)

    const aiResult = await this.executeAgent(
      this.agents.find(a => a.name === 'ai')!,
      ctx,
      intent,
    )
    if (aiResult) results.push(aiResult)

    const handler = this.agents.find(a => a.canHandle(intent))
    if (handler && handler.name !== 'rag' && handler.name !== 'ai') {
      const result = await this.executeAgent(handler, ctx, intent)
      if (result) results.push(result)
    }

    const response = this.buildResponse(intent)

    return { intent, results, response }
  }

  private buildResponse(intent: Intent): string {
    const messages: Record<Intent, string> = {
      greeting: 'Olá! Como posso ajudar você hoje?',
      question: 'Deixe-me buscar essa informação para você.',
      scheduling: 'Claro! Vou verificar a disponibilidade de horários.',
      cancel_scheduling: 'Entendi, vamos cancelar o agendamento.',
      complaint: 'Sinto muito pelo ocorrido. Vou registrar sua reclamação.',
      audio: 'Vou processar seu áudio.',
      unknown: 'Desculpe, não entendi. Pode reformular?',
    }
    return messages[intent] ?? messages.unknown
  }
}
