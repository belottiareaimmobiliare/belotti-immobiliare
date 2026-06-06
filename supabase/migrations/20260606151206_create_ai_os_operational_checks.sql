create table if not exists public.ai_os_operational_checks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  section_key text not null,
  is_ok boolean not null default false,
  checked_by text,
  checked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_os_operational_checks_section_key_check check (
    section_key in (
      'property-edit',
      'drive-share',
      'lead-note',
      'social-card',
      'documents',
      'fillable-modules',
      'agency-practices',
      'visure'
    )
  ),
  constraint ai_os_operational_checks_property_section_unique unique (property_id, section_key)
);

create index if not exists ai_os_operational_checks_property_id_idx
  on public.ai_os_operational_checks(property_id);

alter table public.ai_os_operational_checks enable row level security;

revoke all on table public.ai_os_operational_checks from anon;
grant select, insert, update, delete on table public.ai_os_operational_checks to authenticated;

drop policy if exists "Admin authenticated can read operational checks" on public.ai_os_operational_checks;
drop policy if exists "Admin authenticated can insert operational checks" on public.ai_os_operational_checks;
drop policy if exists "Admin authenticated can update operational checks" on public.ai_os_operational_checks;
drop policy if exists "Admin authenticated can delete operational checks" on public.ai_os_operational_checks;

create policy "Admin authenticated can read operational checks"
on public.ai_os_operational_checks
for select
to authenticated
using (true);

create policy "Admin authenticated can insert operational checks"
on public.ai_os_operational_checks
for insert
to authenticated
with check (true);

create policy "Admin authenticated can update operational checks"
on public.ai_os_operational_checks
for update
to authenticated
using (true)
with check (true);

create policy "Admin authenticated can delete operational checks"
on public.ai_os_operational_checks
for delete
to authenticated
using (true);
