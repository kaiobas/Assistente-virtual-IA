---
name: rag-context
description: |
  Use quando precisar buscar contexto vetorial, gerar embeddings, ou consultar o RAG.
  Ativa para perguntas sobre "buscar contexto", "embedding", "RAG", "similaridade", "knowledge base".
---

# Skill: RAG Context

Gerencia contexto vetorial para RAG via Prisma + Ollama embeddings.

## Buscar contexto relevante

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function gerarEmbedding(texto: string): Promise<number[]> {
  const res = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: texto }),
  })
  const data = await res.json() as { embedding: number[] }
  return data.embedding
}

async function buscarContexto(mensagem: string) {
  const embedding = await gerarEmbedding(mensagem)

  const chunks = await prisma.$queryRaw<Array<{ content: string; similarity: number }>>`
    SELECT content, 1 - (embedding <=> ${embedding}::vector) AS similarity
    FROM context_chunks
    ORDER BY similarity DESC
    LIMIT 5
  `

  const knowledge = await prisma.$queryRaw<Array<{ content: string; similarity: number }>>`
    SELECT content, 1 - (embedding <=> ${embedding}::vector) AS similarity
    FROM knowledge_base
    ORDER BY similarity DESC
    LIMIT 3
  `

  return { chunks, knowledge }
}
```

## Inserir chunk no contexto

```typescript
async function salvarChunk(conversationId: string, content: string) {
  const embedding = await gerarEmbedding(content)
  await prisma.contextChunk.create({
    data: { conversationId, content, embedding },
  })
}
```

## Dependências
- PostgreSQL com extensão `pgvector`
- Ollama rodando local (`ollama serve`)
- Modelo: `nomic-embed-text` (768 dimensões)
- `@prisma/client`
