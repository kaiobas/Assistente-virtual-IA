# Skill: WhatsApp Evolution

Configura Evolution API, webhooks e instâncias WhatsApp.

## Instância

```bash
# Criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "assistente", "qrcode": true}'

# Obter QR Code
curl -X GET http://localhost:8080/instance/qrcode/assistente \
  -H "apikey: $EVOLUTION_API_KEY"

# Status da conexão
curl -X GET http://localhost:8080/instance/connectionState/assistente \
  -H "apikey: $EVOLUTION_API_KEY"
```

## Webhook

```bash
# Configurar webhook global
curl -X POST http://localhost:8080/webhook/set/assistente \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "http://n8n:5678/webhook/whatsapp",
      "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
    }
  }'
```

## Envio de Mensagem

```bash
curl -X POST http://localhost:8080/message/sendText/assistente \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Olá! Como posso ajudar?"
  }'
```

## Eventos
| Evento | Descrição |
|---|---|
| `MESSAGES_UPSERT` | Nova mensagem recebida |
| `CONNECTION_UPDATE` | Mudança no status da conexão |
| `QRCODE_UPDATED` | Novo QR Code gerado |
