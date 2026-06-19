# CLAUDE.md — Assistente Virtual IA

## Projeto
Plataforma de atendimento automatizado via WhatsApp com IA generativa (GPT-4o-mini), transcrição de áudio (Whisper), agendamentos (Google Calendar) e dashboard visual.

## Stack
- **Orquestração:** n8n (fluxos em `src/automation/flows/`)
- **WhatsApp Gateway:** Evolution API
- **IA:** OpenAI GPT-4o-mini + Whisper
- **Banco:** Supabase (PostgreSQL) + Prisma (RAG)
- **Dashboard:** React/Next.js (`src/dashboard/`)
- **Cache/Buffer:** Redis
- **Infra:** Docker Compose (`infra/docker-compose.yml`)

## Comandos
```bash
# Dashboard
cd src/dashboard && npm run dev

# Infra local
docker compose -f infra/docker-compose.yml up -d

# Prisma (RAG context)
npx prisma generate
npx prisma db push
npx prisma studio

# Edge Functions (Supabase)
cd supabase/functions && deno run --allow-net --allow-env index.ts
```

## Estrutura
```
.
├── CLAUDE.md              # Instruções para IA
├── opencode.json          # Config opencode
├── spec/                  # Especificação do projeto
├── prisma/                # Schema RAG (contexto vetorial)
├── agents/                # Docs dos agentes especializados
├── skills/                # Skills reutilizáveis
├── src/
│   ├── agents/            # Agent Orchestrator (TS)
│   ├── automation/flows/  # Fluxos n8n exportados (JSON)
│   ├── api/functions/     # Edge Functions (Supabase/Deno)
│   └── dashboard/         # Frontend React
├── infra/                 # Docker Compose + env
├── supabase/functions/    # Edge Functions
└── docs/                  # Documentação
```

## Convenções
- TypeScript estrito para todo código novo
- Commits em português (convencional: `feat:`, `fix:`, `docs:`, `chore:`)
- Fluxos n8n exportados como JSON em `src/automation/flows/`
- Toda lógica de IA passa pelo RAG (Prisma) antes de chamar OpenAI
- Variáveis de ambiente nunca commitadas (template em `infra/.env.example`)
- Preferir funções puras e testáveis

## RAG Context
O Prisma schema em `prisma/schema.prisma` gerencia:
- `Conversation` — sessões de chat
- `Message` — mensagens individuais
- `ContextChunk` — chunks vetorizados para RAG
- `KnowledgeBase` — documentos base de conhecimento

Sempre buscar contexto relevante via `ContextChunk` antes de montar o prompt da IA.

## Links Úteis
- [Docs](docs/)
- [Roadmap](docs/roadmap.md)
- [Arquitetura](docs/architecture.md)
