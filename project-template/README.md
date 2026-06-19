# Template de Projeto — opencode + RAG + Ollama

## Como usar

1. Copie os arquivos para a raiz do novo projeto:
   ```bash
   cp -r project-template/* ../novo-projeto/
   cp -r project-template/.* ../novo-projeto/ 2>/dev/null; true
   ```

2. Edite `CLAUDE.md` — substitua `{{PLACEHOLDERS}}` pelos valores do projeto

3. Configure o banco:
   - Certifique-se de ter PostgreSQL com extensão `pgvector`
   - Copie `prisma/schema.prisma` e ajuste se necessário
   - Execute `npx prisma generate && npx prisma db push`

4. Configure o Ollama:
   ```bash
   ollama pull nomic-embed-text
   ollama serve
   ```

5. Habilite as skills no `opencode.json` ajustando os paths se necessário

## Estrutura do template

```
project-template/
├── CLAUDE.md              # → Editar com dados do projeto
├── opencode.json          # → Config opencode (skills, agents, refs)
├── prisma/
│   └── schema.prisma      # → Schema RAG (pgvector, 768d)
├── agents/
│   └── rag-agent.md       # → Agente RAG (Ollama embeddings)
└── skills/
    ├── rag-context/
    │   └── SKILL.md       # → Skill de busca vetorial
    └── clean-code/
        └── SKILL.md       # → Skill de boas práticas
```

## Dependências do projeto
- Node.js 20+
- PostgreSQL + pgvector
- Ollama (nomic-embed-text)
- Prisma
