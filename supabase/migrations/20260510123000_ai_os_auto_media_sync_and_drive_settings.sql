alter table public.ai_os_files
add column if not exists external_url text;

create table if not exists public.ai_os_drive_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null default 'default',
  drive_root_name text,
  drive_root_url text,
  drive_root_folder_id text,
  large_file_threshold_mb integer not null default 50,
  storage_strategy text not null default 'supabase_public_drive_archive',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(singleton_key)
);

alter table public.ai_os_drive_settings enable row level security;

drop policy if exists "Admin can read ai os drive settings" on public.ai_os_drive_settings;
create policy "Admin can read ai os drive settings"
on public.ai_os_drive_settings
for select
to authenticated
using (true);

drop policy if exists "Admin can insert ai os drive settings" on public.ai_os_drive_settings;
create policy "Admin can insert ai os drive settings"
on public.ai_os_drive_settings
for insert
to authenticated
with check (true);

drop policy if exists "Admin can update ai os drive settings" on public.ai_os_drive_settings;
create policy "Admin can update ai os drive settings"
on public.ai_os_drive_settings
for update
to authenticated
using (true)
with check (true);

create or replace function public.set_ai_os_drive_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ai_os_drive_settings_updated_at on public.ai_os_drive_settings;

create trigger trg_ai_os_drive_settings_updated_at
before update on public.ai_os_drive_settings
for each row
execute function public.set_ai_os_drive_settings_updated_at();

insert into public.ai_os_drive_settings (
  singleton_key,
  drive_root_name,
  large_file_threshold_mb,
  storage_strategy,
  notes
)
values (
  'default',
  'Belotti AI-OS / Archivio Immobili',
  50,
  'supabase_public_drive_archive',
  'Drive viene usato come archivio free per video e documenti pesanti; Supabase resta lo storage ufficiale per galleria pubblica e file sito.'
)
on conflict (singleton_key) do nothing;

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

create index if not exists ai_os_files_external_url_idx
on public.ai_os_files(property_id, external_url)
where external_url is not null and is_deleted = false;

-- evita doppioni sui media collegati alla galleria
with ranked as (
  select
    id,
    row_number() over (
      partition by property_media_id
      order by is_deleted asc, created_at asc
    ) as rn
  from public.ai_os_files
  where property_media_id is not null
)
update public.ai_os_files
set
  is_deleted = true,
  property_media_id = null,
  is_gallery_visible = false
where id in (
  select id
  from ranked
  where rn > 1
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_os_files_property_media_id_unique'
  ) then
    alter table public.ai_os_files
    add constraint ai_os_files_property_media_id_unique unique (property_media_id);
  end if;
end $$;

create or replace function public.ai_os_file_name_from_media(
  input_url text,
  fallback_name text
)
returns text
language plpgsql
as $$
declare
  clean_url text;
  raw_name text;
begin
  clean_url := coalesce(nullif(input_url, ''), '');
  raw_name := regexp_replace(clean_url, '^.*/', '');
  raw_name := regexp_replace(raw_name, '\\?.*$', '');

  if raw_name is null or raw_name = '' then
    return fallback_name;
  end if;

  return left(raw_name, 120);
end;
$$;

create or replace function public.ai_os_sync_property_media_row()
returns trigger
language plpgsql
as $$
declare
  next_folder_type text;
  next_file_kind text;
  next_mime_type text;
  next_file_name text;
  next_bucket text;
begin
  if new.property_id is null or coalesce(new.file_url, '') = '' then
    return new;
  end if;

  next_folder_type :=
    case
      when new.media_type = 'plan' then 'docs'
      else 'images'
    end;

  next_file_name := coalesce(
    nullif(new.label, ''),
    public.ai_os_file_name_from_media(
      new.file_url,
      concat(coalesce(new.media_type, 'media'), '-', left(new.id::text, 8))
    )
  );

  next_file_kind :=
    case
      when new.media_type = 'image' then 'image'
      when new.media_type = 'video' then 'video'
      when new.media_type = 'plan' and lower(next_file_name) like '%.pdf' then 'pdf'
      when new.media_type = 'plan' and (
        lower(next_file_name) like '%.jpg'
        or lower(next_file_name) like '%.jpeg'
        or lower(next_file_name) like '%.png'
        or lower(next_file_name) like '%.webp'
      ) then 'image'
      else 'generic'
    end;

  next_mime_type :=
    case
      when lower(next_file_name) like '%.jpg' or lower(next_file_name) like '%.jpeg' then 'image/jpeg'
      when lower(next_file_name) like '%.png' then 'image/png'
      when lower(next_file_name) like '%.webp' then 'image/webp'
      when lower(next_file_name) like '%.gif' then 'image/gif'
      when lower(next_file_name) like '%.mp4' then 'video/mp4'
      when lower(next_file_name) like '%.mov' then 'video/quicktime'
      when lower(next_file_name) like '%.pdf' then 'application/pdf'
      when new.media_type = 'image' then 'image/jpeg'
      when new.media_type = 'video' then 'video/mp4'
      else null
    end;

  next_bucket :=
    case
      when next_folder_type = 'docs' then 'property-plans'
      else 'property-media'
    end;

  insert into public.ai_os_files (
    property_id,
    file_name,
    file_kind,
    folder_type,
    mime_type,
    size_bytes,
    storage_bucket,
    storage_path,
    external_url,
    txt_content,
    property_media_id,
    is_gallery_visible,
    is_deleted
  )
  values (
    new.property_id,
    next_file_name,
    next_file_kind,
    next_folder_type,
    next_mime_type,
    0,
    next_bucket,
    null,
    new.file_url,
    null,
    new.id,
    true,
    false
  )
  on conflict (property_media_id) do update
  set
    property_id = excluded.property_id,
    file_name = excluded.file_name,
    file_kind = excluded.file_kind,
    folder_type = excluded.folder_type,
    mime_type = excluded.mime_type,
    external_url = excluded.external_url,
    is_gallery_visible = true,
    is_deleted = false,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_ai_os_sync_property_media_insert_update on public.property_media;

create trigger trg_ai_os_sync_property_media_insert_update
after insert or update of file_url, label, media_type, property_id
on public.property_media
for each row
execute function public.ai_os_sync_property_media_row();

-- import adesso di tutti i media già presenti negli immobili
insert into public.ai_os_files (
  property_id,
  file_name,
  file_kind,
  folder_type,
  mime_type,
  size_bytes,
  storage_bucket,
  storage_path,
  external_url,
  txt_content,
  property_media_id,
  is_gallery_visible,
  is_deleted
)
select
  pm.property_id,
  coalesce(
    nullif(pm.label, ''),
    public.ai_os_file_name_from_media(pm.file_url, concat(coalesce(pm.media_type, 'media'), '-', left(pm.id::text, 8)))
  ) as file_name,
  case
    when pm.media_type = 'image' then 'image'
    when pm.media_type = 'video' then 'video'
    when pm.media_type = 'plan' and lower(pm.file_url) like '%.pdf%' then 'pdf'
    when pm.media_type = 'plan' and (
      lower(pm.file_url) like '%.jpg%'
      or lower(pm.file_url) like '%.jpeg%'
      or lower(pm.file_url) like '%.png%'
      or lower(pm.file_url) like '%.webp%'
    ) then 'image'
    else 'generic'
  end as file_kind,
  case
    when pm.media_type = 'plan' then 'docs'
    else 'images'
  end as folder_type,
  case
    when lower(pm.file_url) like '%.jpg%' or lower(pm.file_url) like '%.jpeg%' then 'image/jpeg'
    when lower(pm.file_url) like '%.png%' then 'image/png'
    when lower(pm.file_url) like '%.webp%' then 'image/webp'
    when lower(pm.file_url) like '%.gif%' then 'image/gif'
    when lower(pm.file_url) like '%.mp4%' then 'video/mp4'
    when lower(pm.file_url) like '%.mov%' then 'video/quicktime'
    when lower(pm.file_url) like '%.pdf%' then 'application/pdf'
    when pm.media_type = 'image' then 'image/jpeg'
    when pm.media_type = 'video' then 'video/mp4'
    else null
  end as mime_type,
  0 as size_bytes,
  case
    when pm.media_type = 'plan' then 'property-plans'
    else 'property-media'
  end as storage_bucket,
  null as storage_path,
  pm.file_url as external_url,
  null as txt_content,
  pm.id as property_media_id,
  true as is_gallery_visible,
  false as is_deleted
from public.property_media pm
where pm.property_id is not null
  and coalesce(pm.file_url, '') <> ''
on conflict (property_media_id) do update
set
  property_id = excluded.property_id,
  file_name = excluded.file_name,
  file_kind = excluded.file_kind,
  folder_type = excluded.folder_type,
  mime_type = excluded.mime_type,
  external_url = excluded.external_url,
  is_gallery_visible = true,
  is_deleted = false,
  updated_at = now();
