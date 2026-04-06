<div align="center">
  <h1>🤖 Assistente Virtual IA</h1>
  <p><strong>Assistente de IA integrado ao WhatsApp para atendimento, respostas automáticas e agendamentos</strong></p>

  ![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
  ![License](https://img.shields.io/badge/license-MIT-blue)
  ![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
</div>

---

## 📋 Sobre o Projeto

O **Assistente Virtual IA** é um produto completo de atendimento automatizado via WhatsApp, com inteligência artificial generativa (GPT-4o-mini), reconhecimento de áudio (Whisper), agendamentos via Google Calendar e um dashboard visual para monitoramento e relatórios.

### ✨ Funcionalidades Principais

| Módulo | Descrição |
|---|---|
| 💬 **Automação WhatsApp** | Atendimento automático, respostas a dúvidas, mensagens de boas-vindas |
| 📅 **Agendamentos** | Criação e confirmação de agendamentos via chat (Google Calendar) |
| 📊 **Dashboard Visual** | Painel de controle com métricas e histórico de atendimentos |
| 🔔 **Notificações** | Alertas em tempo real para equipe e lembretes para clientes |
| 📈 **Relatórios** | Exportação de dados e análise de desempenho |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente (WhatsApp)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     Evolution API                            │
│              (Gateway WhatsApp / Webhooks)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                          n8n                                 │
│             (Orquestração / Automação de Fluxos)             │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │   Redis     │  │  OpenAI    │  │  Google Calendar API │  │
│  │ (Debounce/  │  │ GPT-4o-mini│  │    (Agendamentos)    │  │
│  │  Buffer)    │  │  + Whisper │  │                      │  │
│  └─────────────┘  └────────────┘  └──────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                        Supabase                              │
│          (PostgreSQL + Auth + Storage + Realtime)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Dashboard (React/Next.js)                  │
│           (Painel de controle, Relatórios, Notificações)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

### Backend / Automação
- **[n8n](https://n8n.io/)** — Orquestração de automações e fluxos
- **[Evolution API](https://github.com/EvolutionAPI/evolution-api)** — Integração com WhatsApp
- **[OpenAI GPT-4o-mini](https://openai.com/)** — Processamento de linguagem natural
- **[Whisper](https://openai.com/research/whisper)** — Transcrição de áudios
- **[Redis](https://redis.io/)** — Debounce de mensagens e buffer de contexto

### Banco de Dados & Auth
- **[Supabase](https://supabase.com/)** — PostgreSQL + Autenticação + Storage + Realtime

### Frontend / Dashboard
- **[React](https://react.dev/) / [Next.js](https://nextjs.org/)** — Dashboard visual

### Integrações Opcionais
- **[Google Calendar API](https://developers.google.com/calendar)** — Gestão de agendamentos

---

## 📁 Estrutura do Projeto

```
assistente-virtual-ia/
├── docs/                        # Documentação do projeto
│   ├── architecture.md          # Arquitetura detalhada
│   ├── roadmap.md               # Roadmap e milestones
│   ├── setup.md                 # Guia de configuração do ambiente
│   ├── contributing.md          # Guia de contribuição
│   └── api/                     # Documentação das APIs
├── src/
│   ├── automation/              # Fluxos n8n (exportados como JSON)
│   │   ├── flows/               # Fluxos de automação
│   │   └── templates/           # Templates de mensagens
│   ├── dashboard/               # Frontend React/Next.js
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── api/                     # Funções serverless / edge functions (Supabase)
│       ├── webhooks/
│       └── functions/
├── infra/                       # Infraestrutura e deploy
│   ├── docker-compose.yml       # Stack local completa
│   └── .env.example             # Variáveis de ambiente
├── .github/
│   ├── ISSUE_TEMPLATE/          # Templates de issues
│   └── workflows/               # GitHub Actions (CI/CD)
└── README.md
```

---

## 🚀 Como Começar

### Pré-requisitos

- Node.js >= 18
- Docker e Docker Compose
- Conta Supabase
- Conta OpenAI (API Key)
- Instância Evolution API

### Instalação

```bash
# Clone o repositório
git clone https://github.com/kaiobas/Assistente-virtual-IA.git
cd Assistente-virtual-IA

# Configure as variáveis de ambiente
cp infra/.env.example .env

# Suba a stack local
docker compose -f infra/docker-compose.yml up -d
```

Consulte o [Guia de Setup](docs/setup.md) para instruções detalhadas.

---

## 📖 Documentação

| Documento | Descrição |
|---|---|
| [Arquitetura](docs/architecture.md) | Visão técnica detalhada do sistema |
| [Roadmap](docs/roadmap.md) | Fases de entrega e milestones |
| [Setup](docs/setup.md) | Configuração do ambiente de desenvolvimento |
| [Contribuição](docs/contributing.md) | Como contribuir com o projeto |

---

## 🗺️ Roadmap

Veja o [Roadmap completo](docs/roadmap.md) ou acompanhe as [milestones no GitHub](../../milestones).

| Fase | Descrição | Status |
|---|---|---|
| 🏗️ **MVP** | Automação básica WhatsApp + IA | 🔄 Em andamento |
| 📊 **Dashboard** | Painel visual de atendimentos | ⏳ Planejado |
| 📅 **Agendamentos** | Integração Google Calendar | ⏳ Planejado |
| 📈 **Relatórios** | Analytics e exportações | ⏳ Planejado |

---

## 🤝 Contribuição

Contribuições são bem-vindas! Leia o [Guia de Contribuição](docs/contributing.md) antes de abrir um Pull Request.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
