-- Phase 1: Schema Changes

-- Create a new 'modules' table for glossary organization
create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Update the existing 'glossary' table to include modular relationships and extended metadata
alter table glossary
  add column if not exists module_id uuid references modules(id) on delete cascade,
  add column if not exists type text, -- e.g., 'button', 'label', 'error'
  add column if not exists description text,
  add column if not exists exceptions jsonb; -- e.g., { "de": "Zurück", "pt": "Voltar" }

-- Optional: update 'context' field to allow nulls
alter table glossary
  alter column context drop not null;

-- Phase 2: RLS

alter table modules enable row level security;

create policy if not exists "Allow read access to modules"
on modules for select
using (auth.role() = 'authenticated'); 