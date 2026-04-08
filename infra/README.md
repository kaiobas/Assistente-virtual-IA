# infra/

Migrations, seeds e rollbacks do banco de dados.

## Estrutura

```
infra/
├── migrations/   # Schema, funções, triggers, índices e RLS
├── seeds/        # Dados de teste (nunca rodar em produção)
├── rollbacks/    # DROP correspondente a cada migration
└── README.md
```

## Ordem de execução

As migrations seguem numeração estrita. **Nunca pular nem reordenar.**

| Arquivo | Responsabilidade |
|---|---|
| V001 | Extensions (uuid-ossp, pgcrypto, pg_trgm) |
| V002 | Tabela `business` |
| V003 | Tabela `clients` + enum `ia_status_enum` |
| V004 | Tabelas `professionals`, `services`, `professional_services` |
| V005 | Tabelas `availability_rules`, `availability_exceptions` |
| V006 | Tabelas `appointments`, `appointment_status_history` + enums |
| V007 | Tabelas `conversation_sessions`, `conversation_messages` + enums |
| V008 | Tabelas `notification_queue`, `notification_log` + enums |
| V009 | Funções: `create_appointment`, `get_available_slots`, `set_updated_at` |
| V010 | Triggers: auditoria, notificações, updated_at, last_contact |
| V011 | Índices de performance |
| V012 | Row Level Security policies |

## Como aplicar no Supabase

### Opção A — SQL Editor (recomendado para início)

1. Acesse **Supabase Dashboard → SQL Editor**
2. Abra cada arquivo na ordem V001 → V012
3. Cole o conteúdo e clique em **Run**
4. Verifique se não há erros antes de avançar

### Opção B — Supabase CLI (recomendado para produção)

```bash
# Instalar CLI
npm install -g supabase

# Linkar com o projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrations (apenas as novas)
supabase db push

# Ou rodar um arquivo específico
psql "$SUPABASE_DB_URL" -f migrations/V001__create_extensions.sql
```

### Aplicar seeds (apenas em desenvolvimento)

```bash
psql "$SUPABASE_DB_URL" -f seeds/S001__seed_business.sql
psql "$SUPABASE_DB_URL" -f seeds/S002__seed_catalog.sql
psql "$SUPABASE_DB_URL" -f seeds/S003__seed_availability.sql
```

## Variáveis de ambiente necessárias

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   # service_role key (não a anon key)
SUPABASE_DB_URL=postgresql://postgres:senha@db.xxxx.supabase.co:5432/postgres
```

## Regras

- **Nunca editar** uma migration já aplicada em produção — criar uma nova V0XX
- **Seeds nunca em produção** — usar apenas em dev/staging
- Todo campo novo em tabela existente → nova migration `V0XX__add_campo_tabela.sql`
- Rollbacks devem ser mantidos atualizados junto com cada migration
