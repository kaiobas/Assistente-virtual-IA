# 🗺️ Roadmap — Assistente Virtual IA

## Visão do Produto

Entregar um assistente de IA completo integrado ao WhatsApp, com automação inteligente, dashboard visual e sistema de agendamentos, possibilitando que negócios atinjam escalabilidade no atendimento sem aumentar a equipe.

---

## 🏁 Milestones

### Milestone 1 — MVP: Automação Básica com IA
> **Meta:** Sistema funcional que recebe mensagens no WhatsApp e responde com IA

**Issues planejadas:**
- [ ] Configurar instância Evolution API (Docker)
- [ ] Configurar instância n8n (Docker)
- [ ] Configurar Redis para debounce
- [ ] Criar fluxo n8n: recepção de mensagem via webhook
- [ ] Criar fluxo n8n: debounce com Redis
- [ ] Integrar OpenAI GPT-4o-mini no fluxo n8n
- [ ] Configurar Supabase: schema inicial (contacts, conversations, messages)
- [ ] Persistir mensagens e respostas no Supabase
- [ ] Suporte a mensagens de áudio (Whisper)
- [ ] Testes do fluxo completo end-to-end

**Critério de aceite:** Enviar mensagem de texto e áudio no WhatsApp e receber resposta gerada por IA.

---

### Milestone 2 — Agendamentos
> **Meta:** IA capaz de identificar intenção de agendamento e criar eventos

**Issues planejadas:**
- [ ] Configurar Google Calendar API (OAuth2)
- [ ] Criar flow n8n: detecção de intenção de agendamento
- [ ] Integrar Google Calendar no fluxo de agendamentos
- [ ] Criar tabela `appointments` no Supabase
- [ ] Implementar confirmação de agendamento via WhatsApp
- [ ] Implementar lembretes automáticos (notificação 24h antes)
- [ ] Testes de agendamento end-to-end

**Critério de aceite:** Usuário solicita agendamento via WhatsApp, IA cria evento no Google Calendar e envia confirmação.

---

### Milestone 3 — Dashboard Visual
> **Meta:** Painel de controle web para visualização e gestão de atendimentos

**Issues planejadas:**
- [ ] Scaffolding do projeto Next.js/React
- [ ] Configurar autenticação (Supabase Auth)
- [ ] Página: Overview com métricas (total atendimentos, tempo médio, etc.)
- [ ] Página: Lista de conversas com histórico
- [ ] Página: Perfil de contatos
- [ ] Página: Gestão de agendamentos
- [ ] Página: Configurações da instância WhatsApp
- [ ] Integração Supabase Realtime (atualizações ao vivo)
- [ ] Design responsivo (mobile-first)

**Critério de aceite:** Usuário consegue visualizar todas as conversas, responder manualmente e ver status dos agendamentos via web.

---

### Milestone 4 — Notificações
> **Meta:** Sistema de alertas para equipe e lembretes para clientes

**Issues planejadas:**
- [ ] Notificação interna: nova conversa para a equipe (email/dashboard)
- [ ] Notificação interna: alerta de erro no fluxo
- [ ] Lembrete de agendamento para cliente (via WhatsApp - 1h e 24h antes)
- [ ] Notificação de mensagens não respondidas (SLA)
- [ ] Configurações de notificação no dashboard

**Critério de aceite:** Equipe recebe alertas sobre novos atendimentos, erros e agendamentos próximos.

---

### Milestone 5 — Relatórios e Analytics
> **Meta:** Exportação de dados e análise de desempenho do assistente

**Issues planejadas:**
- [ ] Página de relatórios no dashboard
- [ ] Gráfico: volume de atendimentos por período
- [ ] Gráfico: tipos de solicitações (dúvidas, agendamentos, reclamações)
- [ ] Gráfico: tempo médio de resposta
- [ ] Gráfico: taxa de resolução automatizada vs. manual
- [ ] Exportação de dados em CSV/PDF
- [ ] Filtros por período, canal e status

**Critério de aceite:** Gestores conseguem extrair relatórios de desempenho do assistente com filtros e exportação.

---

## 📅 Cronograma Estimado

```
Mês 1     Mês 2     Mês 3     Mês 4
[=====MS1=====][==MS2==][====MS3====]
                        [=MS4=][=MS5=]
```

| Milestone | Prazo Estimado |
|---|---|
| MS1 — MVP | 3 semanas |
| MS2 — Agendamentos | 2 semanas |
| MS3 — Dashboard | 3 semanas |
| MS4 — Notificações | 1 semana |
| MS5 — Relatórios | 2 semanas |

---

## 🏷️ Labels Utilizadas

| Label | Cor | Descrição |
|---|---|---|
| `feature` | `#0075ca` | Nova funcionalidade |
| `bug` | `#d73a4a` | Comportamento inesperado |
| `documentation` | `#0075ca` | Melhorias na documentação |
| `automation` | `#e4e669` | Relacionado aos fluxos n8n |
| `dashboard` | `#84b6eb` | Frontend/dashboard |
| `infra` | `#f9d0c4` | Infraestrutura e deploy |
| `ai` | `#bfd4f2` | Modelos de IA (OpenAI, Whisper) |
| `database` | `#d4c5f9` | Supabase / banco de dados |
| `whatsapp` | `#25D366` | Evolution API / WhatsApp |
| `priority: high` | `#e11d48` | Alta prioridade |
| `priority: medium` | `#f59e0b` | Média prioridade |
| `priority: low` | `#6b7280` | Baixa prioridade |
| `blocked` | `#b60205` | Issue bloqueada |
| `in progress` | `#fbca04` | Em andamento |
