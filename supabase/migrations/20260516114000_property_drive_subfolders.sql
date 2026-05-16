create extension if not exists pgcrypto;

create table if not exists public.property_drive_subfolders (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  folder_key text not null,
  folder_name text not null,
  drive_folder_id text not null,
  drive_folder_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, folder_key)
);

create index if not exists property_drive_subfolders_property_id_idx
on public.property_drive_subfolders(property_id);

create index if not exists property_drive_subfolders_drive_folder_id_idx
on public.property_drive_subfolders(drive_folder_id);

alter table public.property_drive_subfolders enable row level security;
