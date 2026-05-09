create table if not exists public.property_checklist_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  item_key text not null,
  label text not null,
  is_done boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, item_key)
);

alter table public.property_checklist_items enable row level security;

drop policy if exists "Admin can read property checklist items" on public.property_checklist_items;
create policy "Admin can read property checklist items"
on public.property_checklist_items
for select
to authenticated
using (true);

drop policy if exists "Admin can insert property checklist items" on public.property_checklist_items;
create policy "Admin can insert property checklist items"
on public.property_checklist_items
for insert
to authenticated
with check (true);

drop policy if exists "Admin can update property checklist items" on public.property_checklist_items;
create policy "Admin can update property checklist items"
on public.property_checklist_items
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Admin can delete property checklist items" on public.property_checklist_items;
create policy "Admin can delete property checklist items"
on public.property_checklist_items
for delete
to authenticated
using (true);

create index if not exists property_checklist_items_property_id_idx
on public.property_checklist_items(property_id);

create index if not exists property_checklist_items_is_done_idx
on public.property_checklist_items(property_id, is_done);

create or replace function public.set_property_checklist_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_property_checklist_items_updated_at on public.property_checklist_items;

create trigger trg_property_checklist_items_updated_at
before update on public.property_checklist_items
for each row
execute function public.set_property_checklist_items_updated_at();
