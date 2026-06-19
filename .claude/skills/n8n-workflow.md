# Skill: n8n Workflow

Cria, valida e exporta fluxos n8n como JSON.

## Estrutura de um Fluxo

```json
{
  "name": "Nome do Fluxo",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": { "path": "whatsapp" }
    },
    {
      "name": "OpenAI",
      "type": "n8n-nodes-base.openAi",
      "position": [450, 300],
      "parameters": {
        "model": "gpt-4o-mini",
        "messages": { "values": [...] }
      }
    }
  ],
  "connections": {
    "Webhook": { "main": [[ { "node": "OpenAI", "type": "main" } ]] }
  }
}
```

## Convenções
- Exportar para `src/automation/flows/`
- Nome do arquivo: `fluxo-descritivo.json`
- Usar `Webhook` como trigger node
- Credenciais como variáveis de ambiente

## Fluxos Principais
| Arquivo | Descrição |
|---|---|
| `fluxo-recepcao.json` | Recebe mensagem, aplica debounce |
| `fluxo-processamento.json` | RAG + OpenAI + resposta |
| `fluxo-agendamento.json` | Google Calendar integration |
