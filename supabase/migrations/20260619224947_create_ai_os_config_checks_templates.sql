create extension if not exists pgcrypto;

create table if not exists public.ai_os_check_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_os_check_items (
  id uuid primary key default gen_random_uuid(),
  section_key text not null references public.ai_os_check_sections(section_key) on delete cascade,
  item_key text not null,
  item_label text not null,
  group_label text,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(section_key, item_key)
);

create table if not exists public.ai_os_document_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  title text not null,
  category text not null default 'documenti',
  description text,
  file_name text not null,
  storage_bucket text not null default 'ai-os-templates',
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  size_bytes bigint not null default 0,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_os_document_template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.ai_os_document_templates(id) on delete cascade,
  field_key text not null,
  field_label text not null,
  source_hint text,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id, field_key)
);

alter table public.ai_os_check_sections enable row level security;
alter table public.ai_os_check_items enable row level security;
alter table public.ai_os_document_templates enable row level security;
alter table public.ai_os_document_template_fields enable row level security;

revoke all on public.ai_os_check_sections from anon, authenticated;
revoke all on public.ai_os_check_items from anon, authenticated;
revoke all on public.ai_os_document_templates from anon, authenticated;
revoke all on public.ai_os_document_template_fields from anon, authenticated;

insert into storage.buckets (id, name, public)
values ('ai-os-templates', 'ai-os-templates', false)
on conflict (id) do nothing;

insert into public.ai_os_check_sections
(section_key, title, description, sort_order, is_active)
values
  ('documents', 'Documenti agenzia', 'Mandato, privacy, antiriciclaggio, dati proprietario e documenti base.', 10, true),
  ('practices', 'Pratiche e verifiche', 'Catasto, urbanistica, APE, impianti, condominio e locazione.', 20, true),
  ('social', 'Social e pubblicazione', 'Controlli prima della pubblicazione social e vetrina.', 30, true)
on conflict (section_key) do update set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.ai_os_check_items
(section_key, item_key, item_label, group_label, is_required, sort_order, is_active)
values
  ('documents', 'id-owner', 'Carta d’identità proprietario / intestatari', 'Documenti personali proprietario', true, 10, true),
  ('documents', 'tax-code-owner', 'Codice fiscale / tessera sanitaria proprietario', 'Documenti personali proprietario', true, 20, true),
  ('documents', 'marital-status', 'Stato civile e regime patrimoniale', 'Documenti personali proprietario', true, 30, true),
  ('documents', 'company-docs', 'Se società: visura camerale e poteri di firma', 'Documenti personali proprietario', false, 40, true),
  ('documents', 'proxy-docs', 'Se delegato/procuratore: procura o delega valida', 'Documenti personali proprietario', false, 50, true),

  ('documents', 'ownership-title', 'Atto di provenienza / rogito / donazione / successione', 'Provenienza immobile', true, 60, true),
  ('documents', 'inheritance-docs', 'Se successione: dichiarazione successione e volture', 'Provenienza immobile', false, 70, true),
  ('documents', 'mortgage-status', 'Mutuo residuo, ipoteche, vincoli o pignoramenti verificati', 'Provenienza immobile', false, 80, true),

  ('documents', 'agency-mandate', 'Incarico / mandato firmato', 'Documenti agenzia', true, 90, true),
  ('documents', 'privacy-consent', 'Privacy e consenso trattamento dati firmati', 'Documenti agenzia', true, 100, true),
  ('documents', 'aml-check', 'Antiriciclaggio / adeguata verifica cliente', 'Documenti agenzia', true, 110, true),
  ('documents', 'data-collection-form', 'Scheda raccolta dati immobile/proprietario compilata', 'Documenti agenzia', false, 120, true),

  ('practices', 'catastal-record', 'Visura catastale aggiornata', 'Catasto', true, 10, true),
  ('practices', 'floor-plan', 'Planimetria catastale aggiornata', 'Catasto', true, 20, true),
  ('practices', 'catastal-compliance', 'Conformità catastale verificata', 'Catasto', true, 30, true),
  ('practices', 'subalterns', 'Elaborato planimetrico / elenco subalterni se necessario', 'Catasto', false, 40, true),

  ('practices', 'urban-title', 'Titolo edilizio / concessione / licenza / permesso verificato', 'Urbanistica', true, 50, true),
  ('practices', 'urban-compliance', 'Conformità urbanistica o relazione tecnica', 'Urbanistica', true, 60, true),
  ('practices', 'habitability', 'Agibilità / abitabilità se disponibile', 'Urbanistica', false, 70, true),
  ('practices', 'building-practices', 'CILA / SCIA / condoni / sanatorie verificate se presenti', 'Urbanistica', false, 80, true),

  ('practices', 'ape', 'APE valido', 'Energia e impianti', true, 90, true),
  ('practices', 'systems-cert', 'Dichiarazioni conformità impianti se presenti', 'Energia e impianti', false, 100, true),
  ('practices', 'boiler-booklet', 'Libretto caldaia e manutenzioni se presenti', 'Energia e impianti', false, 110, true),

  ('practices', 'condo-expenses', 'Spese condominiali consuntivo/preventivo', 'Condominio', false, 120, true),
  ('practices', 'condo-rules', 'Regolamento condominiale', 'Condominio', false, 130, true),
  ('practices', 'extraordinary-works', 'Delibere lavori straordinari verificate', 'Condominio', false, 140, true),
  ('practices', 'admin-release', 'Liberatoria amministratore prima del rogito', 'Condominio', false, 150, true),

  ('practices', 'rental-contract', 'Contratto di locazione e scadenze verificate', 'Se immobile locato', false, 160, true),
  ('practices', 'tenant-status', 'Situazione inquilino, cauzione e disdetta verificate', 'Se immobile locato', false, 170, true),

  ('social', 'gallery-ready', 'Foto galleria selezionate e ordinate', 'Materiale pubblico', true, 10, true),
  ('social', 'cover-ready', 'Foto copertina verificata', 'Materiale pubblico', true, 20, true),
  ('social', 'description-ready', 'Descrizione immobile pronta per pubblicazione', 'Testi', true, 30, true),
  ('social', 'privacy-media-check', 'Nessun documento privato presente nei media pubblici', 'Privacy', true, 40, true)
on conflict (section_key, item_key) do update set
  item_label = excluded.item_label,
  group_label = excluded.group_label,
  is_required = excluded.is_required,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

create index if not exists ai_os_check_items_section_idx
on public.ai_os_check_items(section_key, sort_order);

create index if not exists ai_os_document_templates_category_idx
on public.ai_os_document_templates(category, is_active);

create index if not exists ai_os_document_template_fields_template_idx
on public.ai_os_document_template_fields(template_id, sort_order);
