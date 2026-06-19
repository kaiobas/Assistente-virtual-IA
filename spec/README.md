# Assistente Virtual IA — Especificação

## 1. Visão Geral

**Assistente Virtual IA** é uma plataforma de atendimento automatizado via WhatsApp que utiliza inteligência artificial generativa (GPT-4o-mini) para responder dúvidas, transcrever áudios (Whisper), realizar agendamentos (Google Calendar) e fornecer um dashboard visual para monitoramento.

## 2. Stack Tecnológica

| Componente | Tecnologia | Versão |
|---|---|---|
| Orquestração | n8n | latest |
| WhatsApp Gateway | Evolution API | latest |
| IA Conversacional | OpenAI GPT-4o-mini | - |
| Transcrição Áudio | Whisper (OpenAI) | - |
| Banco Principal | Supabase (PostgreSQL) | 15+ |
| RAG Contexto | Prisma + PostgreSQL | 5+ |
| Cache | Redis | 7 |
| Dashboard | React / Next.js | 14+ |
| Infra | Docker Compose | 2+ |

## 3. Arquitetura

```
WhatsApp → Evolution API → n8n → RAG (Prisma) → OpenAI GPT
                                    ↑
                              Supabase DB
                                    ↓
                              Dashboard
```

### Fluxo de Mensagens

1. Cliente envia mensagem no WhatsApp
2. Evolution API recebe e dispara webhook para n8n
3. n8n aplica debounce (Redis 3s) e agrupa mensagens
4. Busca contexto RAG no Prisma (histórico da conversa + knowledge base)
5. Monta prompt completo e envia para OpenAI GPT-4o-mini
6. Se for áudio, transcreve via Whisper antes
7. Salva mensagem + resposta no Supabase
8. Resposta é enviada ao cliente via Evolution API
9. Se detectar intenção de agendamento → Google Calendar API

## 4. Esquema do Banco (RAG)

### Core (Supabase)
- `contacts` — clientes/contatos
- `conversations` — sessões de chat
- `messages` — mensagens individuais
- `appointments` — agendamentos

### RAG (Prisma)
- `Conversation` — sessões de chat
- `Message` — mensagens com embedding
- `ContextChunk` — chunks vetorizados para busca semântica
- `KnowledgeBase` — documentos base de conhecimento

## 5. Agentes

| Agente | Responsabilidade |
|---|---|
| `whatsapp-agent` | Evolution API, instâncias, webhooks |
| `rag-agent` | Prisma schema, embeddings, busca semântica |
| `ai-agent` | OpenAI, prompts, Whisper, tokens |
| `dashboard-agent` | React, Next.js, Supabase Auth, UI |
| `scheduling-agent` | Google Calendar, agendamentos, lembretes |
| `notification-agent` | Notificações internas, alertas SLA |

## 6. Skills

| Skill | Descrição |
|---|---|
| `rag-context` | Busca e gerencia contexto vetorial para RAG |
| `n8n-workflow` | Cria, valida e exporta fluxos n8n |
| `whatsapp-evolution` | Configura Evolution API e webhooks |
| `prompt-engineering` | Otimiza prompts de sistema para a IA |
| `calendar-integration` | Integração com Google Calendar |

## 7. Convenções

- TypeScript estrito
- Commits em português (convencional)
- Fluxos n8n exportados como JSON
- Toda IA passa pelo RAG antes de chamar OpenAI
- Variáveis de ambiente: `infra/.env.example`

## 8. Milestones

1. **MVP** — Automação WhatsApp + IA (3 semanas)
2. **Agendamentos** — Google Calendar (2 semanas)
3. **Dashboard** — Painel visual (3 semanas)
4. **Notificações** — Alertas e lembretes (1 semana)
5. **Relatórios** — Analytics e exportação (2 semanas)

## 9. Variáveis de Ambiente

```
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EVOLUTION_API_KEY=
EVOLUTION_API_URL=
EVOLUTION_INSTANCE=
REDIS_URL=
N8N_HOST=
N8N_BASIC_AUTH_USER=
N8N_BASIC_AUTH_PASSWORD=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DATABASE_URL=                 # Prisma connection string
```
