# Skill: RAG Context

Busca e gerencia contexto vetorial para RAG via Prisma + OpenAI embeddings.

## Uso

### Buscar contexto relevante
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function buscarContexto(mensagem: string, conversationId: string) {
  const embedding = await gerarEmbedding(mensagem)

  const chunks = await prisma.$queryRaw`
    SELECT content, 1 - (embedding <=> ${embedding}::vector) AS similarity
    FROM context_chunks
    WHERE conversation_id = ${conversationId}
    ORDER BY similarity DESC
    LIMIT 5
  `

  const knowledge = await prisma.$queryRaw`
    SELECT content, 1 - (embedding <=> ${embedding}::vector) AS similarity
    FROM knowledge_base
    ORDER BY similarity DESC
    LIMIT 3
  `

  return { chunks, knowledge }
}
```

### Inserir chunk no contexto
```typescript
async function salvarChunk(conversationId: string, content: string) {
  const embedding = await gerarEmbedding(content)
  await prisma.contextChunk.create({
    data: { conversationId, content, embedding }
  })
}
```

## Dependências
- `@prisma/client`
- `openai` (para embeddings)
- PostgreSQL com extensão `pgvector`
