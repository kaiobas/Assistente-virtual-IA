import type { Agent, AgentContext, AgentResult, Intent } from '../types'

export class AIAgent implements Agent {
  name = 'ai'
  description = 'Processa mensagens com OpenAI GPT-4o-mini e Whisper'

  canHandle(_intent: Intent): boolean {
    return true
  }

  async execute(ctx: AgentContext): Promise<AgentResult> {
    const isAudio = !!ctx.mediaUrl

    const actions = isAudio
      ? [{ type: 'transcribe' as const, payload: { url: ctx.mediaUrl! } }]
      : []

    return {
      success: true,
      data: {
        model: 'gpt-4o-mini',
        context: ctx.message,
        needsTranscription: isAudio,
      },
      actions,
    }
  }
}
