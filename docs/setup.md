# ⚙️ Guia de Configuração do Ambiente

## Pré-requisitos

- [Docker](https://www.docker.com/) >= 24.x
- [Docker Compose](https://docs.docker.com/compose/) >= 2.x
- [Node.js](https://nodejs.org/) >= 18.x
- [Git](https://git-scm.com/)
- Conta [Supabase](https://supabase.com/)
- Conta [OpenAI](https://platform.openai.com/) com créditos e API Key

---

## 1. Clonar o Repositório

```bash
git clone https://github.com/kaiobas/Assistente-virtual-IA.git
cd Assistente-virtual-IA
```

---

## 2. Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp infra/.env.example .env
```

Edite o arquivo `.env` com suas configurações. Veja a seção de cada serviço abaixo.

---

## 3. Supabase

### Opção A: Supabase Cloud (Recomendado para início)

1. Crie um projeto em [supabase.com](https://supabase.com/)
2. Anote as credenciais em **Project Settings > API**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Execute as migrations do banco:
   ```bash
   # (futuro) npx supabase db push
   ```

### Opção B: Supabase Self-hosted (Docker)

```bash
# Adicione ao docker-compose.yml ou use o CLI oficial
npx supabase start
```

---

## 4. Subir a Stack Local

```bash
docker compose -f infra/docker-compose.yml up -d
```

Aguarde todos os containers subirem:

```bash
docker compose -f infra/docker-compose.yml ps
```

Serviços disponíveis:

| Serviço | URL Local | Credenciais |
|---|---|---|
| n8n | http://localhost:5678 | Definido no `.env` |
| Evolution API | http://localhost:8080 | `EVOLUTION_API_KEY` |
| Redis | localhost:6379 | Sem auth (local) |

---

## 5. Configurar Evolution API

1. Acesse http://localhost:8080
2. Crie uma nova instância:
   ```bash
   curl -X POST http://localhost:8080/instance/create \
     -H "apikey: SUA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"instanceName": "assistente", "qrcode": true}'
   ```
3. Escaneie o QR Code com o WhatsApp
4. Configure o webhook apontando para o n8n:
   ```bash
   curl -X POST http://localhost:8080/webhook/set/assistente \
     -H "apikey: SUA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "webhook": {
         "enabled": true,
         "url": "http://n8n:5678/webhook/whatsapp",
         "events": ["MESSAGES_UPSERT"]
       }
     }'
   ```

---

## 6. Configurar n8n

1. Acesse http://localhost:5678
2. Crie sua conta de admin
3. Importe os fluxos disponíveis em `src/automation/flows/`:
   - Acesse **Settings > Import from file**
4. Configure as credenciais:
   - **OpenAI**: Chave da API OpenAI
   - **Supabase**: URL e Service Role Key
   - **Redis**: `localhost:6379`
   - **Google Calendar** (opcional): OAuth2

---

## 7. Configurar o Dashboard

```bash
cd src/dashboard
npm install
cp .env.example .env.local
# Edite .env.local com as credenciais do Supabase
npm run dev
```

Acesse em http://localhost:3000

---

## 8. Testando o Fluxo Completo

1. Envie uma mensagem de texto para o número do WhatsApp conectado
2. Verifique no n8n que o webhook foi acionado (aba **Executions**)
3. Aguarde a resposta no WhatsApp
4. Verifique no Supabase se a mensagem foi salva na tabela `messages`
5. Verifique no Dashboard se a conversa aparece

---

## Variáveis de Ambiente Referência

| Variável | Obrigatório | Descrição |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | Chave da API OpenAI |
| `SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | ✅ | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave de serviço do Supabase |
| `EVOLUTION_API_KEY` | ✅ | Chave da Evolution API |
| `EVOLUTION_API_URL` | ✅ | URL da instância Evolution API |
| `EVOLUTION_INSTANCE` | ✅ | Nome da instância WhatsApp |
| `REDIS_URL` | ✅ | URL de conexão Redis |
| `N8N_HOST` | ✅ | Host do n8n |
| `N8N_BASIC_AUTH_USER` | ✅ | Usuário básico do n8n |
| `N8N_BASIC_AUTH_PASSWORD` | ✅ | Senha básica do n8n |
| `GOOGLE_CLIENT_ID` | ⬜ | Client ID Google OAuth2 |
| `GOOGLE_CLIENT_SECRET` | ⬜ | Client Secret Google OAuth2 |

---

## Troubleshooting

**Evolution API não conecta ao WhatsApp:**
- Verifique se o QR Code foi escaneado corretamente
- Reinicie a instância: `docker compose restart evolution-api`

**n8n não recebe webhooks:**
- Verifique se a URL do webhook está acessível pelo container da Evolution API
- Use o nome do serviço Docker como host (ex: `http://n8n:5678`) ao invés de `localhost`

**Erros de CORS no dashboard:**
- Verifique as configurações de `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
