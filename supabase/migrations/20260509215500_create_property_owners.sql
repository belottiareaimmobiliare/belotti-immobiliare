create table if not exists public.property_owners (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_type text not null default 'person',
  role text not null default 'owner',
  full_name text not null,
  email text,
  phone text,
  tax_code text,
  vat_number text,
  address text,
  city text,
  province text,
  notes text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.property_owners enable row level security;

drop policy if exists "Admin can read property owners" on public.property_owners;
create policy "Admin can read property owners"
on public.property_owners
for select
to authenticated
using (true);

drop policy if exists "Admin can insert property owners" on public.property_owners;
create policy "Admin can insert property owners"
on public.property_owners
for insert
to authenticated
with check (true);

drop policy if exists "Admin can update property owners" on public.property_owners;
create policy "Admin can update property owners"
on public.property_owners
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Admin can delete property owners" on public.property_owners;
create policy "Admin can delete property owners"
on public.property_owners
for delete
to authenticated
using (true);

create index if not exists property_owners_property_id_idx
on public.property_owners(property_id);

create index if not exists property_owners_is_primary_idx
on public.property_owners(property_id, is_primary);

create or replace function public.set_property_owners_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_property_owners_updated_at on public.property_owners;

create trigger trg_property_owners_updated_at
before update on public.property_owners
for each row
execute function public.set_property_owners_updated_at();
