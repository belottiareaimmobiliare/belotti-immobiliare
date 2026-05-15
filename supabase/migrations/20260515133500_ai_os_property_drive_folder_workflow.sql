alter table public.property_drive_folders
add column if not exists drive_folder_name text;

alter table public.property_drive_folders
add column if not exists sync_status text default 'synced';

alter table public.property_drive_folders
add column if not exists last_synced_at timestamptz;

alter table public.property_drive_folders
add column if not exists last_error text;

alter table public.property_drive_folders
add column if not exists created_at timestamptz default now();

alter table public.property_drive_folders
add column if not exists updated_at timestamptz default now();

create unique index if not exists property_drive_folders_property_id_unique
on public.property_drive_folders(property_id);

create table if not exists public.property_drive_folder_jobs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid,
  action text not null check (action in ('upsert', 'delete')),
  desired_folder_name text,
  drive_folder_id text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists property_drive_folder_jobs_status_idx
on public.property_drive_folder_jobs(status, created_at);

create index if not exists property_drive_folder_jobs_property_id_idx
on public.property_drive_folder_jobs(property_id);

create or replace function public.build_property_drive_folder_name(
  input_property_id uuid,
  input_reference_code text,
  input_title text
)
returns text
language plpgsql
as $$
declare
  prefix text;
  clean_title text;
begin
  prefix := upper(nullif(trim(coalesce(input_reference_code, '')), ''));

  if prefix is null then
    prefix := upper(left(replace(input_property_id::text, '-', ''), 6));
  end if;

  clean_title := regexp_replace(coalesce(input_title, 'Immobile'), '\s+', ' ', 'g');
  clean_title := trim(clean_title);

  if clean_title = '' then
    clean_title := 'Immobile';
  end if;

  clean_title := left(clean_title, 90);

  return prefix || ' - ' || clean_title;
end;
$$;

create or replace function public.enqueue_property_drive_folder_upsert()
returns trigger
language plpgsql
as $$
declare
  desired_name text;
begin
  desired_name := public.build_property_drive_folder_name(
    new.id,
    new.reference_code,
    new.title
  );

  update public.property_drive_folder_jobs
  set
    desired_folder_name = desired_name,
    status = 'pending',
    attempts = 0,
    last_error = null,
    updated_at = now(),
    processed_at = null
  where property_id = new.id
    and action = 'upsert'
    and status in ('pending', 'failed');

  if not found then
    insert into public.property_drive_folder_jobs (
      property_id,
      action,
      desired_folder_name,
      status
    )
    values (
      new.id,
      'upsert',
      desired_name,
      'pending'
    );
  end if;

  return new;
end;
$$;

create or replace function public.enqueue_property_drive_folder_delete()
returns trigger
language plpgsql
as $$
declare
  old_drive_folder_id text;
begin
  select drive_folder_id
  into old_drive_folder_id
  from public.property_drive_folders
  where property_id = old.id
  limit 1;

  delete from public.property_drive_folder_jobs
  where property_id = old.id
    and action = 'upsert'
    and status in ('pending', 'failed');

  if old_drive_folder_id is not null and trim(old_drive_folder_id) <> '' then
    insert into public.property_drive_folder_jobs (
      property_id,
      action,
      desired_folder_name,
      drive_folder_id,
      status
    )
    values (
      old.id,
      'delete',
      public.build_property_drive_folder_name(old.id, old.reference_code, old.title),
      old_drive_folder_id,
      'pending'
    );
  end if;

  return old;
end;
$$;

drop trigger if exists trg_property_drive_folder_upsert on public.properties;

create trigger trg_property_drive_folder_upsert
after insert or update of title, reference_code, status
on public.properties
for each row
execute function public.enqueue_property_drive_folder_upsert();

drop trigger if exists trg_property_drive_folder_delete on public.properties;

create trigger trg_property_drive_folder_delete
before delete
on public.properties
for each row
execute function public.enqueue_property_drive_folder_delete();

insert into public.property_drive_folder_jobs (
  property_id,
  action,
  desired_folder_name,
  status
)
select
  p.id,
  'upsert',
  public.build_property_drive_folder_name(p.id, p.reference_code, p.title),
  'pending'
from public.properties p
where coalesce(p.status, 'draft') <> 'archived'
  and not exists (
    select 1
    from public.property_drive_folder_jobs j
    where j.property_id = p.id
      and j.action = 'upsert'
      and j.status in ('pending', 'failed')
  );
