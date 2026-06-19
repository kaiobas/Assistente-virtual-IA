# CLAUDE.md — {{PROJECT_NAME}}

## Projeto
{{PROJECT_DESCRIPTION}}

## Stack
- **Runtime:** {{RUNTIME}} (ex: Node 20, Deno, Bun)
- **Linguagem:** {{LANGUAGE}} (ex: TypeScript estrito)
- **Banco:** {{DATABASE}} + Prisma (RAG vetorial)
- **Infra:** {{INFRA}} (ex: Docker, Vercel, Railway)
- **IA:** {{IA_PROVIDER}} + Ollama (embeddings)
- **Frontend:** {{FRAMEWORK}} (se aplicável)

## Comandos
```bash
# Desenvolvimento
{{DEV_COMMAND}}

# Prisma (RAG context)
npx prisma generate
npx prisma db push
npx prisma studio

# Gerar embeddings (Ollama)
ollama pull nomic-embed-text
{{EMBED_SCRIPT}}

# Testes
{{TEST_COMMAND}}

# Lint / Type check
{{LINT_COMMAND}}
```

## Estrutura
```
.
├── CLAUDE.md              # Instruções para IA (este arquivo)
├── opencode.json          # Config opencode
├── prisma/                # Schema Prisma (RAG vetorial)
│   └── schema.prisma
├── agents/                # Agentes opencode
├── skills/                # Skills reutilizáveis
├── src/                   # Código fonte
│   └── ...
├── tests/                 # Testes
├── docs/                  # Documentação
└── infra/                 # Docker, env, configs
```

## RAG Context
O schema Prisma em `prisma/schema.prisma` gerencia o contexto vetorial:
- `Conversation` — sessões de chat
- `Message` — mensagens individuais (com embedding)
- `ContextChunk` — chunks vetorizados para RAG
- `KnowledgeBase` — documentos base de conhecimento

### Fluxo RAG
1. Mensagem chega → busca `ContextChunk` e `KnowledgeBase` por similaridade coseno
2. Embeddings gerados via **Ollama** (`nomic-embed-text`, 768 dimensões)
3. Monta contexto enriquecido com TOP-K resultados
4. Passa contexto + mensagem para o LLM

> Sempre buscar contexto relevante antes de montar o prompt da IA.

## Convenções de código
- Nomes em inglês (código) / Commits em português
- Commits convencionais: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Funções puras e testáveis sempre que possível
- Preferir `const` sobre `let`, evitar `any`
- Variáveis de ambiente nunca commitadas (usar `.env.example`)
- Imports absolutos com alias (`@/`)

## Bons hábitos (sempre seguir)
1. **Leia antes de editar** — entenda o contexto completo antes de mudar
2. **Pequenos commits** — uma mudança por commit, mensagem descritiva
3. **Testes first** — ou pelo menos verifique se testes existentes passam
4. **Sem código morto** — remova imports e variáveis não usados
5. **Tipagem forte** — prefira interfaces/type a `any`
6. **Documente o porquê** — código explica o *como*, comentários explicam o *porquê*
7. **Consistência > Perfeição** — siga o padrão do projeto existente
8. **Segurança** — nunca logar secrets, validar input, escapar output

## Skills disponíveis
- `rag-context` — busca e gerencia contexto vetorial via Prisma + Ollama
- `clean-code` — padrões de código limpo e boas práticas
