create table if not exists public.property_mandates (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_name text not null,
  mandate_type text not null default 'sale',
  assignment_type text not null default 'exclusive',
  status text not null default 'draft',
  start_date date,
  end_date date,
  asking_price numeric(12,2),
  commission_rate numeric(5,2),
  flat_fee numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.property_mandates enable row level security;

drop policy if exists "Admin can read property mandates" on public.property_mandates;
create policy "Admin can read property mandates"
on public.property_mandates
for select
to authenticated
using (true);

drop policy if exists "Admin can insert property mandates" on public.property_mandates;
create policy "Admin can insert property mandates"
on public.property_mandates
for insert
to authenticated
with check (true);

drop policy if exists "Admin can update property mandates" on public.property_mandates;
create policy "Admin can update property mandates"
on public.property_mandates
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Admin can delete property mandates" on public.property_mandates;
create policy "Admin can delete property mandates"
on public.property_mandates
for delete
to authenticated
using (true);

create index if not exists property_mandates_property_id_idx
on public.property_mandates(property_id);

create index if not exists property_mandates_status_idx
on public.property_mandates(property_id, status);

create or replace function public.set_property_mandates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_property_mandates_updated_at on public.property_mandates;

create trigger trg_property_mandates_updated_at
before update on public.property_mandates
for each row
execute function public.set_property_mandates_updated_at();
