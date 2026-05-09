-- AI-OS quota infrastructure
-- Limiti conservativi per evitare di superare lo Storage Free Supabase.
-- Free Storage Supabase: 1 GB. Qui blocchiamo AI-OS a 800 MB.

update storage.buckets
set
  file_size_limit = 83886080
where id = 'ai-os';

create table if not exists public.ai_os_quota_settings (
  id boolean primary key default true check (id = true),

  -- 800 MB hard cap totale AI-OS
  max_total_bytes bigint not null default 838860800,

  -- 650 MB warning
  warn_total_bytes bigint not null default 681574400,

  -- 250 MB max per cartella/immobile
  max_property_bytes bigint not null default 262144000,

  -- 80 MB max per singolo file
  max_file_size_bytes bigint not null default 83886080,

  -- numero massimo file
  max_total_files integer not null default 800,
  max_files_per_property integer not null default 120,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.ai_os_quota_settings (
  id,
  max_total_bytes,
  warn_total_bytes,
  max_property_bytes,
  max_file_size_bytes,
  max_total_files,
  max_files_per_property
)
values (
  true,
  838860800,
  681574400,
  262144000,
  83886080,
  800,
  120
)
on conflict (id) do update
set
  max_total_bytes = excluded.max_total_bytes,
  warn_total_bytes = excluded.warn_total_bytes,
  max_property_bytes = excluded.max_property_bytes,
  max_file_size_bytes = excluded.max_file_size_bytes,
  max_total_files = excluded.max_total_files,
  max_files_per_property = excluded.max_files_per_property,
  updated_at = now();

alter table public.ai_os_quota_settings enable row level security;

drop policy if exists "AI-OS quota settings select authenticated" on public.ai_os_quota_settings;

create policy "AI-OS quota settings select authenticated"
on public.ai_os_quota_settings
for select
to authenticated
using (true);

create or replace function public.ai_os_effective_file_size(
  p_size_bytes bigint,
  p_txt_content text
)
returns bigint
language sql
immutable
as $$
  select greatest(
    0,
    coalesce(
      p_size_bytes,
      octet_length(coalesce(p_txt_content, '')),
      0
    )
  )::bigint;
$$;

create or replace function public.get_ai_os_quota_status()
returns table (
  total_bytes bigint,
  warn_total_bytes bigint,
  max_total_bytes bigint,
  remaining_total_bytes bigint,
  total_files bigint,
  max_total_files integer,
  usage_percent numeric,
  is_warning boolean,
  is_blocked boolean
)
language sql
security definer
set search_path = public
as $$
  with settings as (
    select *
    from public.ai_os_quota_settings
    where id = true
    limit 1
  ),
  usage as (
    select
      coalesce(sum(public.ai_os_effective_file_size(size_bytes, txt_content)), 0)::bigint as total_bytes,
      count(*)::bigint as total_files
    from public.ai_os_files
    where is_deleted = false
  )
  select
    usage.total_bytes,
    settings.warn_total_bytes,
    settings.max_total_bytes,
    greatest(settings.max_total_bytes - usage.total_bytes, 0)::bigint as remaining_total_bytes,
    usage.total_files,
    settings.max_total_files,
    round((usage.total_bytes::numeric / nullif(settings.max_total_bytes, 0)::numeric) * 100, 2) as usage_percent,
    usage.total_bytes >= settings.warn_total_bytes as is_warning,
    usage.total_bytes >= settings.max_total_bytes
      or usage.total_files >= settings.max_total_files as is_blocked
  from usage, settings;
$$;

revoke all on function public.get_ai_os_quota_status() from public;
grant execute on function public.get_ai_os_quota_status() to authenticated;

create or replace function public.assert_ai_os_quota(
  p_property_id uuid,
  p_incoming_size_bytes bigint,
  p_incoming_file_count integer default 1,
  p_exclude_file_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  quota record;
  incoming_size bigint;
  incoming_count integer;
  current_total_bytes bigint;
  current_total_files bigint;
  current_property_bytes bigint;
  current_property_files bigint;
begin
  incoming_size := greatest(coalesce(p_incoming_size_bytes, 0), 0);
  incoming_count := greatest(coalesce(p_incoming_file_count, 1), 1);

  select *
  into quota
  from public.ai_os_quota_settings
  where id = true
  limit 1;

  if not found then
    raise exception 'AI_OS_QUOTA_SETTINGS_MISSING';
  end if;

  if incoming_size > quota.max_file_size_bytes then
    raise exception 'AI_OS_QUOTA_FILE_TOO_BIG: file %, max % bytes',
      incoming_size,
      quota.max_file_size_bytes;
  end if;

  select
    coalesce(sum(public.ai_os_effective_file_size(size_bytes, txt_content)), 0)::bigint,
    count(*)::bigint
  into current_total_bytes, current_total_files
  from public.ai_os_files
  where is_deleted = false
    and (p_exclude_file_id is null or id <> p_exclude_file_id);

  select
    coalesce(sum(public.ai_os_effective_file_size(size_bytes, txt_content)), 0)::bigint,
    count(*)::bigint
  into current_property_bytes, current_property_files
  from public.ai_os_files
  where is_deleted = false
    and property_id = p_property_id
    and (p_exclude_file_id is null or id <> p_exclude_file_id);

  if current_total_bytes + incoming_size > quota.max_total_bytes then
    raise exception 'AI_OS_QUOTA_TOTAL_STORAGE_EXCEEDED: used %, incoming %, max % bytes',
      current_total_bytes,
      incoming_size,
      quota.max_total_bytes;
  end if;

  if current_property_bytes + incoming_size > quota.max_property_bytes then
    raise exception 'AI_OS_QUOTA_PROPERTY_STORAGE_EXCEEDED: used %, incoming %, max % bytes',
      current_property_bytes,
      incoming_size,
      quota.max_property_bytes;
  end if;

  if current_total_files + incoming_count > quota.max_total_files then
    raise exception 'AI_OS_QUOTA_TOTAL_FILES_EXCEEDED: files %, incoming %, max %',
      current_total_files,
      incoming_count,
      quota.max_total_files;
  end if;

  if current_property_files + incoming_count > quota.max_files_per_property then
    raise exception 'AI_OS_QUOTA_PROPERTY_FILES_EXCEEDED: files %, incoming %, max %',
      current_property_files,
      incoming_count,
      quota.max_files_per_property;
  end if;

  return true;
end;
$$;

revoke all on function public.assert_ai_os_quota(uuid, bigint, integer, uuid) from public;
grant execute on function public.assert_ai_os_quota(uuid, bigint, integer, uuid) to authenticated;

create or replace function public.ai_os_files_enforce_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  effective_size bigint;
  excluded_id uuid;
begin
  if new.is_deleted = true then
    return new;
  end if;

  effective_size := public.ai_os_effective_file_size(new.size_bytes, new.txt_content);

  if tg_op = 'UPDATE' then
    excluded_id := old.id;
  else
    excluded_id := null;
  end if;

  perform public.assert_ai_os_quota(
    new.property_id,
    effective_size,
    1,
    excluded_id
  );

  return new;
end;
$$;

drop trigger if exists ai_os_files_enforce_quota_trigger on public.ai_os_files;

create trigger ai_os_files_enforce_quota_trigger
before insert or update of property_id, size_bytes, txt_content, is_deleted
on public.ai_os_files
for each row
execute function public.ai_os_files_enforce_quota();

create index if not exists ai_os_files_active_usage_idx
on public.ai_os_files(property_id, is_deleted, created_at desc);

comment on table public.ai_os_quota_settings is
'AI-OS hard quotas. Default totale 800 MB per non superare il limite Free Supabase Storage.';

comment on function public.get_ai_os_quota_status() is
'Restituisce uso storage AI-OS, soglia warning e stato blocco.';

comment on function public.assert_ai_os_quota(uuid, bigint, integer, uuid) is
'Controlla quote AI-OS prima di upload/insert file.';
