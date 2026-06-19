# Skill: Calendar Integration

Integração com Google Calendar para criação e gestão de agendamentos.

## Autenticação (OAuth2)

```typescript
const { google } = require('googleapis')

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
})

const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
```

## Criar Evento

```typescript
async function criarEvento({ summary, start, end, description }) {
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary,
      description,
      start: { dateTime: start, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: end, timeZone: 'America/Sao_Paulo' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 }
        ]
      }
    }
  })
  return response.data
}
```

## Verificar Disponibilidade

```typescript
async function verificarDisponibilidade(inicio, fim) {
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: inicio,
      timeMax: fim,
      items: [{ id: 'primary' }]
    }
  })
  return response.data.calendars.primary.busy
}
```
