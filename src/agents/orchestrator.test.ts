import { describe, it, expect } from 'vitest'
import { AgentOrchestrator } from './orchestrator'
import type { AgentContext } from './types'

describe('AgentOrchestrator', () => {
  const orchestrator = new AgentOrchestrator()

  const baseCtx: AgentContext = {
    conversationId: 'test-conv',
    contactId: '5511999999999',
    message: '',
  }

  it('detecta saudação', async () => {
    const result = await orchestrator.process({ ...baseCtx, message: 'Olá, tudo bem?' })
    expect(result.intent).toBe('greeting')
  })

  it('detecta agendamento', async () => {
    const result = await orchestrator.process({ ...baseCtx, message: 'Quero marcar um horário' })
    expect(result.intent).toBe('scheduling')
  })

  it('detecta pergunta', async () => {
    const result = await orchestrator.process({ ...baseCtx, message: 'Como funciona o pagamento?' })
    expect(result.intent).toBe('question')
  })

  it('detecta reclamação', async () => {
    const result = await orchestrator.process({ ...baseCtx, message: 'Estou com um problema no serviço' })
    expect(result.intent).toBe('complaint')
  })

  it('retorna resposta adequada para cada intent', async () => {
    const result = await orchestrator.process({ ...baseCtx, message: 'Oi' })
    expect(result.response).toBeTruthy()
    expect(result.results.length).toBeGreaterThan(0)
  })
})
