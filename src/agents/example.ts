/**
 * Exemplo de uso do AgentOrchestrator
 *
 * Modo de usar:
 *   npx tsx src/agents/example.ts
 */

import { AgentOrchestrator } from './orchestrator'
import type { AgentContext } from './types'

async function main() {
  const orchestrator = new AgentOrchestrator()

  const mensagens: AgentContext[] = [
    {
      conversationId: 'conv-1',
      contactId: '5511999999999',
      contactName: 'Maria',
      message: 'Olá, bom dia!',
    },
    {
      conversationId: 'conv-1',
      contactId: '5511999999999',
      message: 'Quero agendar um horário para corte de cabelo',
    },
    {
      conversationId: 'conv-2',
      contactId: '5511888888888',
      message: 'Como funciona o pagamento?',
    },
  ]

  for (const ctx of mensagens) {
    console.log(`\n---`)
    console.log(`Usuário: ${ctx.message}`)
    const result = await orchestrator.process(ctx)
    console.log(`Intent: ${result.intent}`)
    console.log(`Resposta: ${result.response}`)
    console.log(`Agents acionados: ${result.results.map(r => r.success ? '✓' : '✗').join(', ')}`)
  }
}

main().catch(console.error)
