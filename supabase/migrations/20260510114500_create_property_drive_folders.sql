create table if not exists public.property_drive_folders (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  folder_name text,
  drive_folder_url text not null,
  drive_folder_id text,
  sync_status text not null default 'linked',
  notes text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id)
);

alter table public.property_drive_folders enable row level security;

drop policy if exists "Admin can read property drive folders" on public.property_drive_folders;
create policy "Admin can read property drive folders"
on public.property_drive_folders
for select
to authenticated
using (true);

drop policy if exists "Admin can insert property drive folders" on public.property_drive_folders;
create policy "Admin can insert property drive folders"
on public.property_drive_folders
for insert
to authenticated
with check (true);

drop policy if exists "Admin can update property drive folders" on public.property_drive_folders;
create policy "Admin can update property drive folders"
on public.property_drive_folders
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Admin can delete property drive folders" on public.property_drive_folders;
create policy "Admin can delete property drive folders"
on public.property_drive_folders
for delete
to authenticated
using (true);

create index if not exists property_drive_folders_property_id_idx
on public.property_drive_folders(property_id);

create index if not exists property_drive_folders_drive_folder_id_idx
on public.property_drive_folders(drive_folder_id);

create or replace function public.set_property_drive_folders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_property_drive_folders_updated_at on public.property_drive_folders;

create trigger trg_property_drive_folders_updated_at
before update on public.property_drive_folders
for each row
execute function public.set_property_drive_folders_updated_at();
