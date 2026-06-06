create table if not exists public.ai_os_operational_check_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  section_key text not null,
  item_key text not null,
  item_label text not null,
  is_ok boolean not null default false,
  checked_by text,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_os_operational_check_items_section_key_check check (
    section_key in (
      'documents',
      'agency-practices'
    )
  ),
  constraint ai_os_operational_check_items_unique unique (property_id, section_key, item_key)
);

create index if not exists ai_os_operational_check_items_property_id_idx
  on public.ai_os_operational_check_items(property_id);

create index if not exists ai_os_operational_check_items_section_idx
  on public.ai_os_operational_check_items(property_id, section_key);

alter table public.ai_os_operational_check_items enable row level security;

revoke all on table public.ai_os_operational_check_items from anon;
grant select, insert, update, delete on table public.ai_os_operational_check_items to authenticated;

drop policy if exists "Admin authenticated can read operational check items" on public.ai_os_operational_check_items;
drop policy if exists "Admin authenticated can insert operational check items" on public.ai_os_operational_check_items;
drop policy if exists "Admin authenticated can update operational check items" on public.ai_os_operational_check_items;
drop policy if exists "Admin authenticated can delete operational check items" on public.ai_os_operational_check_items;

create policy "Admin authenticated can read operational check items"
on public.ai_os_operational_check_items
for select
to authenticated
using (true);

create policy "Admin authenticated can insert operational check items"
on public.ai_os_operational_check_items
for insert
to authenticated
with check (true);

create policy "Admin authenticated can update operational check items"
on public.ai_os_operational_check_items
for update
to authenticated
using (true)
with check (true);

create policy "Admin authenticated can delete operational check items"
on public.ai_os_operational_check_items
for delete
to authenticated
using (true);
