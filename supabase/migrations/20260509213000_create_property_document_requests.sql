create table if not exists public.property_document_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  request_type text not null,
  status text not null default 'todo',
  title text not null,
  notes text,
  requested_by uuid,
  completed_file_id uuid,
  provider text,
  provider_request_id text,
  cost_cents integer,
  currency text default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.property_document_requests enable row level security;

drop policy if exists "Admin can read property document requests" on public.property_document_requests;
create policy "Admin can read property document requests"
on public.property_document_requests
for select
to authenticated
using (true);

drop policy if exists "Admin can insert property document requests" on public.property_document_requests;
create policy "Admin can insert property document requests"
on public.property_document_requests
for insert
to authenticated
with check (true);

drop policy if exists "Admin can update property document requests" on public.property_document_requests;
create policy "Admin can update property document requests"
on public.property_document_requests
for update
to authenticated
using (true)
with check (true);

create index if not exists property_document_requests_property_id_idx
on public.property_document_requests(property_id);

create index if not exists property_document_requests_status_idx
on public.property_document_requests(status);

create index if not exists property_document_requests_created_at_idx
on public.property_document_requests(created_at desc);

create or replace function public.set_property_document_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_property_document_requests_updated_at on public.property_document_requests;

create trigger trg_property_document_requests_updated_at
before update on public.property_document_requests
for each row
execute function public.set_property_document_requests_updated_at();
