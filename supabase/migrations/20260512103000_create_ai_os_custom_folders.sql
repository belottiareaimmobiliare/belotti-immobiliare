create table if not exists public.ai_os_custom_folders (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  parent_folder_type text not null default 'root',
  parent_custom_folder_id uuid null references public.ai_os_custom_folders(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ai_os_custom_folders_parent_folder_type_check
    check (parent_folder_type in ('root', 'images', 'docs')),

  constraint ai_os_custom_folders_name_not_blank
    check (length(trim(name)) > 0)
);

alter table public.ai_os_files
  add column if not exists custom_folder_id uuid null references public.ai_os_custom_folders(id) on delete set null;

create index if not exists ai_os_custom_folders_property_parent_idx
  on public.ai_os_custom_folders(property_id, parent_folder_type, parent_custom_folder_id)
  where is_deleted = false;

create index if not exists ai_os_files_custom_folder_id_idx
  on public.ai_os_files(custom_folder_id)
  where is_deleted = false;
