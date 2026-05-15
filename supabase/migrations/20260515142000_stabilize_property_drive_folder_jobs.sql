alter table public.property_drive_folders
add column if not exists folder_name text;

alter table public.property_drive_folders
add column if not exists drive_folder_id text;

alter table public.property_drive_folders
add column if not exists sync_status text default 'pending';

alter table public.property_drive_folders
add column if not exists last_error text;

alter table public.property_drive_folders
add column if not exists created_at timestamptz default now();

alter table public.property_drive_folders
add column if not exists updated_at timestamptz default now();

alter table public.property_drive_folder_jobs
add column if not exists updated_at timestamptz default now();

alter table public.property_drive_folder_jobs
add column if not exists processed_at timestamptz;

create index if not exists property_drive_folders_property_id_idx
on public.property_drive_folders(property_id);

create index if not exists property_drive_folder_jobs_retry_idx
on public.property_drive_folder_jobs(status, action, created_at);
