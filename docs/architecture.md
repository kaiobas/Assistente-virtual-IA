# 🏗️ Arquitetura do Sistema

## Visão Geral

O Assistente Virtual IA é composto por camadas bem definidas de responsabilidade, garantindo desacoplamento, escalabilidade e manutenibilidade.

---

## Diagrama de Fluxo de Mensagens

```
Cliente (WhatsApp)
       │
       ▼
Evolution API ──────────────────────► Webhook POST /message
       │
       ▼
n8n (Workflow de Entrada)
  │
  ├─► Redis (debounce 3s) ───────────► Aguarda mais mensagens
  │
  ▼
n8n (Workflow de Processamento)
  │
  ├─► É áudio? ──► Whisper API ──► Transcrição em texto
  │
  ├─► Busca histórico de conversa ◄── Supabase (tabela: messages)
  │
  ├─► Monta prompt com contexto
  │
  ├─► OpenAI GPT-4o-mini ──────────► Resposta gerada
  │
  ├─► Detecta intenção de agendamento?
  │       └─► Google Calendar API ──► Cria/confirma evento
  │
  ├─► Salva mensagem + resposta ──────► Supabase
  │
  └─► Evolution API ───────────────────► Envia resposta ao cliente
```

---

## Componentes

### 1. Evolution API — Gateway WhatsApp

- Responsável pela conexão com o WhatsApp (protocolo Baileys)
- Recebe e envia mensagens via REST API
- Dispara webhooks para o n8n a cada mensagem recebida
- Gerencia sessões de múltiplas instâncias

**Eventos relevantes:**
- `messages.upsert` — Nova mensagem recebida
- `connection.update` — Status da conexão

---

### 2. n8n — Orquestrador de Fluxos

O n8n é o cérebro do sistema. Ele conecta todos os serviços e contém a lógica de negócio dos fluxos.

**Fluxos principais:**

| Fluxo | Trigger | Função |
|---|---|---|
| `flow-incoming-message` | Webhook (Evolution API) | Recebe mensagem, aplica debounce, roteia |
| `flow-process-message` | Interno | Processa com IA, salva e responde |
| `flow-audio-transcription` | Interno | Transcreve áudios via Whisper |
| `flow-scheduling` | Interno | Verifica intenção e agenda no Calendar |
| `flow-notification` | Cron / Trigger | Envia notificações para a equipe |

---

### 3. Redis — Buffer e Debounce

- Agrupa mensagens enviadas em sequência rápida (ex: o usuário envia 3 mensagens em 2 segundos)
- Armazena contexto temporário de conversas ativas
- Previne múltiplas chamadas desnecessárias à OpenAI

**Estratégia de debounce:**
- Ao receber mensagem, insere no buffer com TTL de 3 segundos
- Se nova mensagem chegar antes do TTL expirar, reinicia o timer
- Ao expirar, dispara o processamento com todas as mensagens agrupadas

---

### 4. OpenAI — GPT-4o-mini + Whisper

**GPT-4o-mini:**
- Modelo principal para geração de respostas
- Recebe: prompt de sistema + histórico da conversa + mensagem atual
- Retorna: resposta em texto + (opcional) intenção detectada (agendamento, dúvida, etc.)

**Whisper:**
- Transcrição de mensagens de áudio
- Suporta múltiplos idiomas, incluindo português
- A transcrição é passada ao GPT como texto normal

---

### 5. Supabase — Dados e Auth

**Tabelas principais:**

```sql
-- Contatos / Clientes
contacts (
  id uuid PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now()
)

-- Conversas
conversations (
  id uuid PRIMARY KEY,
  contact_id uuid REFERENCES contacts(id),
  status text DEFAULT 'active', -- active, closed
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Mensagens
messages (
  id uuid PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id),
  role text NOT NULL, -- 'user' | 'assistant'
  content text NOT NULL,
  media_url text,
  created_at timestamptz DEFAULT now()
)

-- Agendamentos
appointments (
  id uuid PRIMARY KEY,
  contact_id uuid REFERENCES contacts(id),
  calendar_event_id text,
  title text,
  scheduled_at timestamptz,
  status text DEFAULT 'pending', -- pending, confirmed, cancelled
  created_at timestamptz DEFAULT now()
)
```

**Recursos utilizados:**
- **Auth** — Autenticação de usuários do dashboard (email/senha + OAuth)
- **Storage** — Armazenamento de áudios e mídias recebidas
- **Realtime** — Subscriptions para atualizações ao vivo no dashboard

---

### 6. Google Calendar API (Opcional)

- Criação automática de eventos via n8n
- Envio de convites por e-mail
- Verificação de disponibilidade de horários

---

### 7. Dashboard — React/Next.js

**Páginas principais:**

| Rota | Descrição |
|---|---|
| `/` | Overview com métricas principais |
| `/conversations` | Lista e histórico de conversas |
| `/contacts` | Cadastro e perfil de contatos |
| `/appointments` | Gestão de agendamentos |
| `/settings` | Configurações da instância e fluxos |
| `/reports` | Relatórios e exportações |

---

## Decisões de Arquitetura

| Decisão | Escolha | Justificativa |
|---|---|---|
| Processamento de mensagens | n8n | Low-code, visual, fácil de manter fluxos complexos |
| Buffer de mensagens | Redis | Alta performance, TTL nativo, simples de usar com n8n |
| Banco de dados | Supabase (PostgreSQL) | Realtime nativo, Auth integrado, Storage, SDK JS |
| IA generativa | GPT-4o-mini | Melhor custo-benefício para atendimento conversacional |
| Transcrição | Whisper (via OpenAI API) | Alta precisão em português |

---

## Considerações de Segurança

- Todas as chaves de API armazenadas como variáveis de ambiente (nunca no código)
- Webhooks protegidos por token de autenticação
- Row Level Security (RLS) habilitado no Supabase
- HTTPS obrigatório em produção
- Rate limiting no n8n para evitar abuso
