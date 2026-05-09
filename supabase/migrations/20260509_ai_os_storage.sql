-- AI-OS storage infrastructure
-- Bucket privato + tabella file collegata agli immobili

create extension if not exists pgcrypto;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'ai-os',
  'ai-os',
  false,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.ai_os_files (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  file_name text not null,
  file_kind text not null check (
    file_kind in ('image', 'video', 'pdf', 'txt', 'plan', 'generic')
  ),
  mime_type text,
  size_bytes bigint,
  storage_bucket text not null default 'ai-os',
  storage_path text,
  txt_content text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_os_files_property_id_idx
on public.ai_os_files(property_id);

create index if not exists ai_os_files_uploaded_by_idx
on public.ai_os_files(uploaded_by);

create index if not exists ai_os_files_created_at_idx
on public.ai_os_files(created_at desc);

create or replace function public.set_ai_os_files_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_ai_os_files_updated_at on public.ai_os_files;

create trigger set_ai_os_files_updated_at
before update on public.ai_os_files
for each row
execute function public.set_ai_os_files_updated_at();

alter table public.ai_os_files enable row level security;

drop policy if exists "AI-OS files select authenticated" on public.ai_os_files;
drop policy if exists "AI-OS files insert authenticated" on public.ai_os_files;
drop policy if exists "AI-OS files update authenticated" on public.ai_os_files;
drop policy if exists "AI-OS files delete authenticated" on public.ai_os_files;

create policy "AI-OS files select authenticated"
on public.ai_os_files
for select
to authenticated
using (true);

create policy "AI-OS files insert authenticated"
on public.ai_os_files
for insert
to authenticated
with check (true);

create policy "AI-OS files update authenticated"
on public.ai_os_files
for update
to authenticated
using (true)
with check (true);

create policy "AI-OS files delete authenticated"
on public.ai_os_files
for delete
to authenticated
using (true);

drop policy if exists "AI-OS storage select authenticated" on storage.objects;
drop policy if exists "AI-OS storage insert authenticated" on storage.objects;
drop policy if exists "AI-OS storage update authenticated" on storage.objects;
drop policy if exists "AI-OS storage delete authenticated" on storage.objects;

create policy "AI-OS storage select authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'ai-os');

create policy "AI-OS storage insert authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'ai-os');

create policy "AI-OS storage update authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'ai-os')
with check (bucket_id = 'ai-os');

create policy "AI-OS storage delete authenticated"
on storage.objects
for delete
to authenticated
using (bucket_id = 'ai-os');
