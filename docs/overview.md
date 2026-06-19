# Assistente Virtual IA — Visão Geral

## O que é?

Uma plataforma de atendimento automatizado via WhatsApp com inteligência artificial generativa — **GPT-4o-mini** — que responde dúvidas, transcreve áudios, agenda compromissos no Google Calendar e entrega relatórios de desempenho por meio de um dashboard visual.

## Como funciona?

```
Cliente envia mensagem → WhatsApp → Evolution API → n8n → OpenAI
                                                          ↓
Cliente recebe resposta ← WhatsApp ← Evolution API ← n8n ←
                                              ↓
                                          Supabase
                                              ↓
                                        Dashboard
```

1. **Cliente envia mensagem** pelo WhatsApp
2. **Evolution API** captura e encaminha para o orquestrador (n8n)
3. **n8n** processa: aplica debounce (Redis), recupera histórico, monta contexto
4. **OpenAI GPT-4o-mini** gera a resposta inteligente; se for áudio, **Whisper** transcreve
5. **Resposta é salva** no Supabase e enviada de volta ao cliente pelo WhatsApp
6. Se detectar **intenção de agendamento**, cria evento automaticamente no **Google Calendar**

Tudo isso é monitorado em tempo real pelo **Dashboard Next.js**, que exibe métricas, histórico de conversas e agendamentos.

## Para quem serve?

Negócios que desejam:

- **Automatizar** o primeiro atendimento via WhatsApp sem perder a qualidade
- **Reduzir** o tempo de resposta a clientes
- **Centralizar** conversas, agendamentos e relatórios em um só lugar
- **Escalar** o suporte sem aumentar a equipe proporcionalmente

## Stack principal

| Componente | Tecnologia |
|---|---|
| Orquestração | n8n |
| WhatsApp Gateway | Evolution API |
| IA Conversacional | OpenAI GPT-4o-mini |
| Transcrição de Áudio | Whisper |
| Banco + Auth + Storage | Supabase (PostgreSQL) |
| Dashboard | React / Next.js |
| Agendamentos | Google Calendar API |

## Status

Projeto em desenvolvimento ativo. MVP em andamento com automação WhatsApp + IA, seguido por dashboard, agendamentos e relatórios.
