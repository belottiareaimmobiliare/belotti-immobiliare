create table if not exists public.property_owner_documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  document_key text not null,
  label text not null,
  status text not null default 'missing',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, document_key)
);

alter table public.property_owner_documents enable row level security;

drop policy if exists "Admin can read property owner documents" on public.property_owner_documents;
create policy "Admin can read property owner documents"
on public.property_owner_documents
for select
to authenticated
using (true);

drop policy if exists "Admin can insert property owner documents" on public.property_owner_documents;
create policy "Admin can insert property owner documents"
on public.property_owner_documents
for insert
to authenticated
with check (true);

drop policy if exists "Admin can update property owner documents" on public.property_owner_documents;
create policy "Admin can update property owner documents"
on public.property_owner_documents
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Admin can delete property owner documents" on public.property_owner_documents;
create policy "Admin can delete property owner documents"
on public.property_owner_documents
for delete
to authenticated
using (true);

create index if not exists property_owner_documents_property_id_idx
on public.property_owner_documents(property_id);

create index if not exists property_owner_documents_status_idx
on public.property_owner_documents(property_id, status);

create or replace function public.set_property_owner_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_property_owner_documents_updated_at on public.property_owner_documents;

create trigger trg_property_owner_documents_updated_at
before update on public.property_owner_documents
for each row
execute function public.set_property_owner_documents_updated_at();
