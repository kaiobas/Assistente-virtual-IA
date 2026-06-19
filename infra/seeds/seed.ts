/**
 * Seed de dados mockados — barbearia fictícia "Barbearia do Zé"
 * Uso: npx tsx infra/seeds/seed.ts
 * Requer: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em infra/.env
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), 'infra/.env') })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em infra/.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ─── helpers ──────────────────────────────────────────────────────────────────

function daysFromNow(n: number, hour = 10, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

async function upsert(table: string, rows: object[], conflict: string) {
  const { error } = await supabase
    .from(table)
    .upsert(rows as never, { onConflict: conflict, ignoreDuplicates: false })
  if (error) throw new Error(`[${table}] ${error.message}`)
  console.log(`  ✔ ${table} (${(rows as []).length} registros)`)
}

// ─── seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Iniciando seed...\n')

  // 1. Business
  const businessId = '00000000-0000-0000-0000-000000000001'
  await upsert('business', [{
    id: businessId,
    name: 'Barbearia do Zé',
    segment: 'barbearia',
    phone_number: '5565999990001',
    timezone: 'America/Cuiaba',
    agent_name: 'Zé Bot',
    agent_persona: 'Você é o assistente virtual da Barbearia do Zé. Seja simpático, direto e use linguagem informal.',
    business_rules: {
      requer_email: false,
      max_dias_antecedencia: 30,
      permite_remarcacao: true,
    },
    modules_enabled: { dashboard: true, notifications: true, reports: false },
    active: true,
  }], 'id')

  // 2. Clients
  const clients = [
    { id: 'c0000000-0000-0000-0000-000000000001', business_id: businessId, name: 'Carlos Mendes',   phone: '5565991110001', ia_status: 'active',         last_contact_at: daysFromNow(-1) },
    { id: 'c0000000-0000-0000-0000-000000000002', business_id: businessId, name: 'João da Silva',   phone: '5565991110002', ia_status: 'active',         last_contact_at: daysFromNow(-2) },
    { id: 'c0000000-0000-0000-0000-000000000003', business_id: businessId, name: 'Pedro Alves',     phone: '5565991110003', ia_status: 'human_takeover', last_contact_at: daysFromNow(0)  },
    { id: 'c0000000-0000-0000-0000-000000000004', business_id: businessId, name: 'Rafael Costa',   phone: '5565991110004', ia_status: 'active',         last_contact_at: daysFromNow(-3) },
    { id: 'c0000000-0000-0000-0000-000000000005', business_id: businessId, name: 'Lucas Ferreira', phone: '5565991110005', ia_status: 'active',         last_contact_at: daysFromNow(-5) },
  ]
  await upsert('clients', clients, 'business_id,phone')

  // 3. Professionals
  const professionals = [
    { id: 'p0000000-0000-0000-0000-000000000001', business_id: businessId, name: 'José Carlos',    display_name: 'Zé',     specialty: 'Corte e barba',       active: true },
    { id: 'p0000000-0000-0000-0000-000000000002', business_id: businessId, name: 'Marcos Tavares', display_name: 'Marcos', specialty: 'Degradê e pigmentação', active: true },
    { id: 'p0000000-0000-0000-0000-000000000003', business_id: businessId, name: 'André Lima',     display_name: 'André',  specialty: 'Barba tradicional',    active: true },
  ]
  await upsert('professionals', professionals, 'id')

  // 4. Services
  const services = [
    { id: 's0000000-0000-0000-0000-000000000001', business_id: businessId, name: 'Corte masculino',    duration_min: 30,  price: 35.00, category: 'corte', active: true },
    { id: 's0000000-0000-0000-0000-000000000002', business_id: businessId, name: 'Barba',              duration_min: 20,  price: 25.00, category: 'barba', active: true },
    { id: 's0000000-0000-0000-0000-000000000003', business_id: businessId, name: 'Corte + Barba',      duration_min: 50,  price: 55.00, category: 'combo', active: true },
    { id: 's0000000-0000-0000-0000-000000000004', business_id: businessId, name: 'Degradê',            duration_min: 40,  price: 45.00, category: 'corte', active: true },
    { id: 's0000000-0000-0000-0000-000000000005', business_id: businessId, name: 'Hidratação capilar', duration_min: 30,  price: 30.00, category: 'trat',  active: true },
  ]
  await upsert('services', services, 'id')

  // 5. Professional ↔ Services
  const ps = [
    { id: 'ps000000-0000-0000-0000-000000000001', professional_id: 'p0000000-0000-0000-0000-000000000001', service_id: 's0000000-0000-0000-0000-000000000001' },
    { id: 'ps000000-0000-0000-0000-000000000002', professional_id: 'p0000000-0000-0000-0000-000000000001', service_id: 's0000000-0000-0000-0000-000000000002' },
    { id: 'ps000000-0000-0000-0000-000000000003', professional_id: 'p0000000-0000-0000-0000-000000000001', service_id: 's0000000-0000-0000-0000-000000000003' },
    { id: 'ps000000-0000-0000-0000-000000000004', professional_id: 'p0000000-0000-0000-0000-000000000002', service_id: 's0000000-0000-0000-0000-000000000001' },
    { id: 'ps000000-0000-0000-0000-000000000005', professional_id: 'p0000000-0000-0000-0000-000000000002', service_id: 's0000000-0000-0000-0000-000000000004' },
    { id: 'ps000000-0000-0000-0000-000000000006', professional_id: 'p0000000-0000-0000-0000-000000000003', service_id: 's0000000-0000-0000-0000-000000000002' },
    { id: 'ps000000-0000-0000-0000-000000000007', professional_id: 'p0000000-0000-0000-0000-000000000003', service_id: 's0000000-0000-0000-0000-000000000003' },
    { id: 'ps000000-0000-0000-0000-000000000008', professional_id: 'p0000000-0000-0000-0000-000000000003', service_id: 's0000000-0000-0000-0000-000000000005' },
  ]
  await upsert('professional_services', ps, 'professional_id,service_id')

  // 6. Availability rules (seg–sex 08–18, sab 08–14)
  const avail: object[] = []
  const avid = (i: number) => `av000000-0000-0000-0000-${String(i).padStart(12, '0')}`
  let ai = 1
  for (const profId of professionals.map(p => p.id)) {
    for (const day of [1, 2, 3, 4, 5]) {
      avail.push({ id: avid(ai++), professional_id: profId, day_of_week: day, start_time: '08:00', end_time: '18:00', active: true })
    }
    avail.push({ id: avid(ai++), professional_id: profId, day_of_week: 6, start_time: '08:00', end_time: '14:00', active: true })
  }
  await upsert('availability_rules', avail, 'id')

  // 7. Appointments
  const appointments = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      business_id: businessId,
      client_id:       'c0000000-0000-0000-0000-000000000001',
      professional_id: 'p0000000-0000-0000-0000-000000000001',
      service_id:      's0000000-0000-0000-0000-000000000003',
      scheduled_at: daysFromNow(1, 9, 0),
      ends_at:      daysFromNow(1, 9, 50),
      status: 'confirmed', source: 'whatsapp',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      business_id: businessId,
      client_id:       'c0000000-0000-0000-0000-000000000002',
      professional_id: 'p0000000-0000-0000-0000-000000000002',
      service_id:      's0000000-0000-0000-0000-000000000004',
      scheduled_at: daysFromNow(1, 10, 0),
      ends_at:      daysFromNow(1, 10, 40),
      status: 'pending', source: 'whatsapp',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      business_id: businessId,
      client_id:       'c0000000-0000-0000-0000-000000000003',
      professional_id: 'p0000000-0000-0000-0000-000000000001',
      service_id:      's0000000-0000-0000-0000-000000000001',
      scheduled_at: daysFromNow(2, 14, 0),
      ends_at:      daysFromNow(2, 14, 30),
      status: 'confirmed', source: 'whatsapp',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000004',
      business_id: businessId,
      client_id:       'c0000000-0000-0000-0000-000000000004',
      professional_id: 'p0000000-0000-0000-0000-000000000003',
      service_id:      's0000000-0000-0000-0000-000000000002',
      scheduled_at: daysFromNow(-1, 11, 0),
      ends_at:      daysFromNow(-1, 11, 20),
      status: 'completed', source: 'whatsapp',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000005',
      business_id: businessId,
      client_id:       'c0000000-0000-0000-0000-000000000005',
      professional_id: 'p0000000-0000-0000-0000-000000000002',
      service_id:      's0000000-0000-0000-0000-000000000001',
      scheduled_at: daysFromNow(-2, 9, 30),
      ends_at:      daysFromNow(-2, 10, 0),
      status: 'cancelled_by_client', source: 'whatsapp', cancelled_reason: 'Imprevisto pessoal',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000006',
      business_id: businessId,
      client_id:       'c0000000-0000-0000-0000-000000000001',
      professional_id: 'p0000000-0000-0000-0000-000000000001',
      service_id:      's0000000-0000-0000-0000-000000000002',
      scheduled_at: daysFromNow(3, 15, 0),
      ends_at:      daysFromNow(3, 15, 20),
      status: 'confirmed', source: 'dashboard',
    },
  ]
  await upsert('appointments', appointments, 'id')

  // 8. Conversation sessions
  const sessions = [
    {
      id: 'cs000000-0000-0000-0000-000000000001',
      session_id:  `5565991110001_${businessId}`,
      client_id:   'c0000000-0000-0000-0000-000000000001',
      business_id: businessId,
      status: 'closed',
      last_message_at: daysFromNow(-1, 10, 0),
      closed_at:       daysFromNow(-1, 10, 5),
    },
    {
      id: 'cs000000-0000-0000-0000-000000000002',
      session_id:  `5565991110002_${businessId}`,
      client_id:   'c0000000-0000-0000-0000-000000000002',
      business_id: businessId,
      status: 'active',
      last_message_at: daysFromNow(0, 9, 30),
    },
    {
      id: 'cs000000-0000-0000-0000-000000000003',
      session_id:  `5565991110003_${businessId}`,
      client_id:   'c0000000-0000-0000-0000-000000000003',
      business_id: businessId,
      status: 'human_takeover',
      last_message_at: daysFromNow(0, 8, 15),
    },
    {
      id: 'cs000000-0000-0000-0000-000000000004',
      session_id:  `5565991110004_${businessId}`,
      client_id:   'c0000000-0000-0000-0000-000000000004',
      business_id: businessId,
      status: 'closed',
      last_message_at: daysFromNow(-3, 14, 0),
      closed_at:       daysFromNow(-3, 14, 10),
    },
  ]
  await upsert('conversation_sessions', sessions, 'session_id')

  // 9. Messages
  const messages = [
    // Carlos — sessão fechada
    { session_id: 'cs000000-0000-0000-0000-000000000001', role: 'user',      content: 'Oi, quero marcar um horário' },
    { session_id: 'cs000000-0000-0000-0000-000000000001', role: 'assistant', content: 'Olá Carlos! Claro, qual serviço você gostaria? Temos Corte, Barba e Combo Corte+Barba.' },
    { session_id: 'cs000000-0000-0000-0000-000000000001', role: 'user',      content: 'Quero corte + barba com o Zé amanhã de manhã' },
    { session_id: 'cs000000-0000-0000-0000-000000000001', role: 'assistant', content: 'Perfeito! Marquei Corte + Barba com o Zé amanhã às 9h. Até lá! ✂️' },

    // João — sessão ativa
    { session_id: 'cs000000-0000-0000-0000-000000000002', role: 'user',      content: 'Bom dia! Tem horário hoje pro degradê?' },
    { session_id: 'cs000000-0000-0000-0000-000000000002', role: 'assistant', content: 'Bom dia João! Hoje temos o Marcos disponível às 10h ou 14h para o Degradê. Qual prefere?' },
    { session_id: 'cs000000-0000-0000-0000-000000000002', role: 'user',      content: 'Prefiro às 10h' },
    { session_id: 'cs000000-0000-0000-0000-000000000002', role: 'assistant', content: 'Ótimo! Agendei Degradê com o Marcos para hoje às 10h. Qualquer dúvida estou aqui! 💈' },

    // Pedro — human takeover
    { session_id: 'cs000000-0000-0000-0000-000000000003', role: 'user',      content: 'Preciso falar com o dono, tive um problema no último atendimento' },
    { session_id: 'cs000000-0000-0000-0000-000000000003', role: 'assistant', content: 'Entendido Pedro, vou transferir você para o nosso atendimento humano agora.' },
    { session_id: 'cs000000-0000-0000-0000-000000000003', role: 'user',      content: 'Ok, obrigado' },

    // Rafael — sessão fechada
    { session_id: 'cs000000-0000-0000-0000-000000000004', role: 'user',      content: 'Qual o preço da barba?' },
    { session_id: 'cs000000-0000-0000-0000-000000000004', role: 'assistant', content: 'Olá Rafael! Nossa barba custa R$ 25,00 e dura cerca de 20 minutos. Quer agendar?' },
    { session_id: 'cs000000-0000-0000-0000-000000000004', role: 'user',      content: 'Sim, pode ser segunda de tarde' },
    { session_id: 'cs000000-0000-0000-0000-000000000004', role: 'assistant', content: 'Prontinho! Barba com o André marcada para segunda às 11h. Até lá! 🪒' },
  ]

  // messages não têm conflito único bom — insert simples deletando antes
  const sessionIds = [...new Set(messages.map(m => m.session_id))]
  const { error: delErr } = await supabase
    .from('conversation_messages')
    .delete()
    .in('session_id', sessionIds)
  if (delErr) throw new Error(`[conversation_messages delete] ${delErr.message}`)

  const { error: msgErr } = await supabase.from('conversation_messages').insert(messages as never)
  if (msgErr) throw new Error(`[conversation_messages] ${msgErr.message}`)
  console.log(`  ✔ conversation_messages (${messages.length} mensagens)`)

  console.log('\n✅  Seed concluído com sucesso!\n')
}

main().catch((err: unknown) => {
  console.error('\n❌ ', err)
  process.exit(1)
})
