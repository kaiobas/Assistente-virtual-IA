# Agent Orchestrator

Sistema de orquestração de agentes especializados para processamento de mensagens.

## Arquitetura

```
Mensagem → AgentOrchestrator
              ├── detectIntent() → 'greeting' | 'scheduling' | 'question' | ...
              ├── RAGAgent (busca contexto vetorial)
              ├── AIAgent (OpenAI + Whisper)
              └── Agent especialista (WhatsApp | Scheduling | ...)
```

## Agents

| Agent | Responsabilidade |
|---|---|
| `WhatsAppAgent` | Envio/recebimento via Evolution API |
| `RAGAgent` | Busca contexto no Prisma, armazena mensagens |
| `AIAgent` | OpenAI GPT-4o-mini, Whisper |
| `SchedulingAgent` | Google Calendar, agendamentos |
| `DashboardAgent` | Dados para o dashboard |
| `NotificationAgent` | Notificações e lembretes |

## Uso

```typescript
import { AgentOrchestrator } from '@/agents'

const orchestrator = new AgentOrchestrator()
const result = await orchestrator.process({
  conversationId: 'uuid',
  contactId: '5511999999999',
  message: 'Quero agendar um horário',
})

console.log(result.intent)    // 'scheduling'
console.log(result.response)  // resposta automática
console.log(result.results)   // resultados dos sub-agents
```
