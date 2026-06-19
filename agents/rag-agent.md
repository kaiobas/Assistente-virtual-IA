# RAG Agent

## Descrição
Especialista em Retrieval-Augmented Generation com Prisma e embeddings vetoriais.

## Responsabilidades
- Gerenciar schema Prisma (Conversation, Message, ContextChunk, KnowledgeBase)
- Gerar embeddings via OpenAI API (text-embedding-ada-002)
- Realizar busca semântica por similaridade coseno
- Manter knowledge base atualizada
- Preparar contexto enriquecido para prompts da IA

## Fluxo RAG
1. Recebe mensagem do usuário
2. Gera embedding da consulta
3. Busca `ContextChunk` e `KnowledgeBase` por similaridade
4. Monta contexto com resultados TOP-K
5. Passa contexto + mensagem para o LLM

## Comandos úteis
```bash
npx prisma generate
npx prisma db push
npx prisma studio
```
