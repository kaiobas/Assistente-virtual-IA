-- V007__create_conversations.sql
-- Sessões de conversa e histórico de mensagens da IA

create type session_status as enum ('active', 'human_takeover', 'closed');
create type message_role   as enum ('user', 'assistant', 'tool');
create type media_type     as enum ('text', 'audio', 'image', 'document');

create table conversation_sessions (
  id               uuid           primary key default gen_random_uuid(),
  session_id       text           not null unique,  -- chave do n8n: phone + business_id
  client_id        uuid           not null references clients(id) on delete cascade,
  business_id      uuid           not null references business(id) on delete cascade,
  status           session_status not null default 'active',
  context_summary  text,          -- resumo gerado pela IA para sessões muito longas
  started_at       timestamptz    not null default now(),
  last_message_at  timestamptz    not null default now(),
  closed_at        timestamptz
);

comment on column conversation_sessions.session_id       is 'Chave externa usada pelo n8n para identificar a sessão';
comment on column conversation_sessions.context_summary  is 'Resumo gerado pela IA quando a janela de contexto fica grande';

create table conversation_messages (
  id           uuid        primary key default gen_random_uuid(),
  session_id   uuid        not null references conversation_sessions(id) on delete cascade,
  role         message_role not null,
  content      text        not null,
  media_type   media_type              default 'text',
  media_url    text,                   -- URL no Supabase Storage (áudio, imagem, doc)
  tokens_used  integer,                -- tokens consumidos na chamada (para controle de custo)
  created_at   timestamptz not null default now()
);

comment on table  conversation_messages              is 'Histórico completo de mensagens por sessão';
comment on column conversation_messages.tokens_used  is 'Tokens OpenAI consumidos — permite calcular custo por cliente';
