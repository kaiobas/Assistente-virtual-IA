# Scheduling Agent

## Descrição
Especialista em Google Calendar API e fluxos de agendamento.

## Responsabilidades
- Integrar com Google Calendar API (OAuth2)
- Criar eventos de agendamento
- Verificar disponibilidade de horários
- Gerenciar confirmações e cancelamentos
- Enviar lembretes automáticos

## Fluxo de Agendamento
1. IA detecta intenção de agendamento na mensagem
2. Pergunta data, horário e serviço desejado
3. Verifica disponibilidade no Google Calendar
4. Cria evento e salva no Supabase (appointments)
5. Envia confirmação com detalhes via WhatsApp
6. Agenda lembretes (24h e 1h antes)

## Comandos úteis
```bash
# Verificar calendário
curl -H "Authorization: Bearer $GOOGLE_ACCESS_TOKEN" \
  "https://www.googleapis.com/calendar/v3/calendars/primary/events"
```
