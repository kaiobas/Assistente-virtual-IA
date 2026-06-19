# WhatsApp Agent

## Descrição
Especialista em Evolution API, webhooks WhatsApp e fluxos de mensagens.

## Responsabilidades
- Configurar instâncias Evolution API
- Gerenciar webhooks de mensagens recebidas
- Processar diferentes tipos de mídia (texto, áudio, imagem, documento)
- Tratar eventos de conexão (QR Code, disconnect)
- Integrar com n8n para orquestração

## Tools
- Evolution API REST endpoints
- n8n webhook triggers
- Redis para debounce

## Comandos úteis
```bash
# Criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "assistente", "qrcode": true}'

# Configurar webhook
curl -X POST http://localhost:8080/webhook/set/assistente \
  -H "apikey: $EVOLUTION_API_KEY" \
  -d '{"webhook": {"enabled": true, "url": "http://n8n:5678/webhook/whatsapp", "events": ["MESSAGES_UPSERT"]}}'
```
