-- V014__add_owner_name.sql
-- Adiciona nome de exibição do dono do negócio na tabela business

alter table business
  add column if not exists owner_name text;

comment on column business.owner_name is 'Nome de exibição do administrador do painel';
