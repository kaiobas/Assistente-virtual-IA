# Assistente Virtual IA

Um projeto pessoal para aprender n8n na prática — integrando WhatsApp, banco de dados e IA generativa num fluxo de atendimento automatizado.

---

## Como surgiu

Eu queria entender de verdade como o n8n funciona além dos tutoriais básicos. A ideia foi construir algo com utilidade real: um assistente de atendimento via WhatsApp que conseguisse responder dúvidas, transcrever áudios e registrar agendamentos — tudo orquestrado por fluxos visuais.

O objetivo nunca foi entregar um produto final. Foi entender como peças distintas se conectam e o que acontece quando você coloca tudo junto em produção.

---

## Arquitetura

O sistema foi crescendo em camadas conforme as necessidades apareciam. O desenho final ficou assim:

```
  WhatsApp (usuário)
        │
        ▼
┌───────────────────┐
│   Evolution API   │  ← gateway que expõe o WhatsApp via webhook
└────────┬──────────┘
         │
         ▼
┌───────────────────┐     ┌─────────────┐
│       n8n         │────▶│    Redis    │  ← buffer de mensagens (debounce)
│  (orquestrador)   │     └─────────────┘
└────────┬──────────┘
         │
    ┌────┴─────────────────────────┐
    │                              │
    ▼                              ▼
┌──────────────┐          ┌────────────────────┐
│    OpenAI    │          │  Google Calendar   │
│ GPT-4o-mini  │          │   (agendamentos)   │
│   Whisper    │          └────────────────────┘
└──────┬───────┘
       │
       ▼
┌───────────────────┐
│     Supabase      │  ← PostgreSQL + Auth + Realtime
│  (banco central)  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Dashboard React  │  ← acompanhamento em tempo real
└───────────────────┘
```

### Fluxo de uma mensagem

Para entender melhor como as peças se encaixam, aqui está o caminho de uma mensagem do recebimento à resposta:

```
1. Usuário envia mensagem no WhatsApp
         │
2. Evolution API dispara webhook → n8n recebe o payload
         │
3. Redis segura a mensagem por ~2s (debounce)
   → evita múltiplos disparos pra uma mesma frase digitada em partes
         │
4. n8n busca histórico da conversa no Supabase
         │
5. n8n consulta o RAG (Prisma) → recupera chunks relevantes
         │
6. Monta o prompt com: histórico + contexto do RAG + mensagem atual
         │
7. Chama GPT-4o-mini → recebe resposta
         │
8. Persiste a troca no Supabase
         │
9. Envia resposta via Evolution API → usuário recebe no WhatsApp
```

---

## Decisões técnicas

Cada ferramenta foi escolhida por um motivo específico — e algumas decisões mudaram no meio do caminho.

### n8n como orquestrador

A escolha do n8n foi o ponto de partida do projeto. Queria algo que tornasse os fluxos visíveis, onde eu pudesse ver exatamente o que estava acontecendo a cada etapa sem precisar debugar código.

O que aprendi: n8n é ótimo pra prototipar rápido, mas exige disciplina. Um fluxo que cresce sem organização vira um espaguete impossível de manter. A solução foi quebrar em sub-workflows menores e com responsabilidades claras.

### Redis para debounce

Isso não estava no plano inicial. O problema apareceu quando usuários digitavam uma mensagem em várias partes e o fluxo disparava três, quatro vezes pra uma mesma intenção.

A solução foi usar o Redis como buffer: ao receber uma mensagem, o n8n aguarda um janela de tempo antes de processar — se chegar outra mensagem do mesmo número nesse intervalo, o timer reinicia. Simples, mas fez diferença real.

### Supabase como banco central

A escolha do Supabase foi pragmática: PostgreSQL com uma interface que acelera o setup, autenticação pronta e Realtime nativo. O Realtime foi o que viabilizou o dashboard sem polling — as métricas atualizam assim que uma nova conversa é registrada.

O esquema de dados levou algumas iterações até ficar estável. Começou simples (só mensagens) e foi crescendo pra incluir sessões, contexto e chunks de RAG.

### RAG com Prisma

A IA respondia bem em geral, mas ficava genérica demais quando o assunto era específico do negócio. A solução foi construir uma base de conhecimento vetorizada: documentos são divididos em chunks, transformados em embeddings e armazenados. Antes de chamar a OpenAI, o sistema recupera os chunks mais relevantes e os inclui no prompt.

O Prisma entrou pra gerenciar esse schema de forma tipada e com migrations controláveis.

### Evolution API como gateway

O WhatsApp não tem API oficial acessível fora do Business Platform. A Evolution API resolve isso expondo uma interface REST + webhooks que o n8n consegue consumir diretamente.

---

## Stack completa

| Camada | Tecnologia | Por quê |
|---|---|---|
| Orquestração | n8n | Fluxos visuais, fácil de inspecionar |
| WhatsApp Gateway | Evolution API | API REST sobre WhatsApp |
| Buffer | Redis | Debounce de mensagens |
| IA | GPT-4o-mini + Whisper | Custo/performance equilibrado |
| Banco | Supabase (PostgreSQL) | Realtime + Auth prontos |
| RAG | Prisma + embeddings | Contexto específico do negócio |
| Dashboard | React / Next.js | Acompanhamento em tempo real |
| Infra | Docker Compose | Stack local reproduzível |

---

## Estrutura do repositório

```
.
├── src/
│   ├── automation/flows/   # Fluxos n8n exportados como JSON
│   ├── dashboard/          # Frontend de acompanhamento
│   └── api/functions/      # Edge functions (Supabase/Deno)
├── prisma/                 # Schema RAG
├── infra/                  # Docker Compose + variáveis de ambiente
└── docs/                   # Arquitetura detalhada e setup
```

---

## Rodando localmente

```bash
git clone https://github.com/kaiobas/Assistente-virtual-IA.git
cd Assistente-virtual-IA

cp infra/.env.example .env

docker compose -f infra/docker-compose.yml up -d

# dashboard
cd src/dashboard && npm run dev
```

Pré-requisitos: Node.js >= 18, Docker, conta Supabase e API key da OpenAI.

---

## O que ficou de aprendizado

- n8n escala bem quando os fluxos são pequenos e bem nomeados — um fluxo gigante é difícil de debugar
- Redis resolveu um problema real de concorrência que só apareceu com uso real
- RAG é mais sobre estrutura de dados do que sobre IA — a qualidade dos chunks importa mais do que o modelo
- Supabase Realtime eliminou a necessidade de polling no dashboard e simplificou bastante o frontend
- Produção e desenvolvimento se comportam diferente no n8n — testar os fluxos com carga real revelou vários edge cases

---

## Licença

MIT
