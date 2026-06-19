# Agents

Este diretório contém a especificação funcional de cada agente especializado.

A implementação em TypeScript está em `src/agents/`.

| Agent | Código | Responsabilidade |
|---|---|---|
| WhatsApp | `src/agents/subagents/whatsapp.agent.ts` | Evolution API, instâncias, webhooks |
| RAG | `src/agents/subagents/rag.agent.ts` | Prisma schema, embeddings, busca semântica |
| AI | `src/agents/subagents/ai.agent.ts` | OpenAI, prompts, Whisper, tokens |
| Scheduling | `src/agents/subagents/scheduling.agent.ts` | Google Calendar, agendamentos, lembretes |
| Dashboard | `src/agents/subagents/dashboard.agent.ts` | React, Next.js, Supabase Auth, UI |
| Notification | `src/agents/subagents/notification.agent.ts` | Notificações internas, alertas SLA |

## Orchestrator

`src/agents/orchestrator.ts` — Roteia mensagens para o agente correto baseado em detecção de intenção.
