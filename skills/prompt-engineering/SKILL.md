# Skill: Prompt Engineering

Otimiza prompts de sistema para a IA baseado em contexto RAG.

## Estrutura do Prompt

```
Sistema: {system_prompt}
Contexto RAG: {rag_context}
Histórico da Conversa: {history}
Mensagem do Usuário: {message}
```

## Template de System Prompt

```
Você é {nome_do_assistente}, assistente virtual da {nome_da_empresa}.

TOM: {profissional, amigável, direto}
IDIOMA: {Português}
RESPOSTAS: {claras, concisas, objetivas}

REGRAS:
- Sempre use o contexto RAG fornecido
- Se não souber, diga que não sabe
- Detecte intenções: agendamento, dúvida, reclamação
- Para agendamentos: coleta data, horário e serviço
- Não invente informações

CONTEXTO:
{rag_context}

HISTÓRICO:
{history}
```

## Boas Práticas
1. Contexto RAG sempre antes da mensagem do usuário
2. Limitar histórico aos últimos 10 turnos
3. Instruções claras sobre formato da resposta
4. Definir tom e persona explicitamente
5. Incluir exemplos few-shot quando necessário

## Gestão de Tokens
- System prompt: ~200 tokens
- Contexto RAG: ~500 tokens
- Histórico: ~1000 tokens (10 turnos médios)
- Reserva para resposta: ~500 tokens
- Total: ~2200 tokens (dentro do limite de 16k do GPT-4o-mini)
