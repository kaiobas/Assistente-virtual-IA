-- V001__create_extensions.sql
-- Habilita extensões necessárias no Supabase
-- Supabase já tem a maioria, mas declarar explicitamente garante

create extension if not exists "uuid-ossp";      -- uuid_generate_v4()
create extension if not exists "pgcrypto";       -- gen_random_uuid() (alternativa moderna)
create extension if not exists "pg_trgm";        -- busca por similaridade de texto (nome de cliente)
