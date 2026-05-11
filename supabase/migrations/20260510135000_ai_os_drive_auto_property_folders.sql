alter table public.property_drive_folders
alter column drive_folder_url drop not null;

alter table public.property_drive_folders
alter column sync_status set default 'pending_creation';

create or replace function public.ai_os_property_drive_folder_name(
  p_id uuid,
  p_title text,
  p_reference_code text,
  p_comune text,
  p_property_type text
)
returns text
language plpgsql
as $$
declare
  raw_name text;
begin
  raw_name := concat(
    coalesce(nullif(trim(p_reference_code), ''), left(p_id::text, 8)),
    ' - ',
    coalesce(
      nullif(trim(p_title), ''),
      nullif(trim(concat(coalesce(p_property_type, ''), ' ', coalesce(p_comune, ''))), ''),
      concat('Immobile ', left(p_id::text, 8))
    )
  );

  raw_name := regexp_replace(raw_name, '[\\/:*?"<>|]+', ' ', 'g');
  raw_name := regexp_replace(raw_name, '\s+', ' ', 'g');

  return left(trim(raw_name), 150);
end;
$$;

create or replace function public.ai_os_create_property_drive_placeholder()
returns trigger
language plpgsql
as $$
begin
  insert into public.property_drive_folders (
    property_id,
    folder_name,
    drive_folder_url,
    drive_folder_id,
    sync_status,
    notes
  )
  values (
    new.id,
    public.ai_os_property_drive_folder_name(
      new.id,
      new.title,
      new.reference_code,
      new.comune,
      new.property_type
    ),
    null,
    null,
    'pending_creation',
    'Cartella Drive preconfigurata automaticamente da AI-OS. Verrà creata sotto la root Drive agenzia.'
  )
  on conflict (property_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_ai_os_create_property_drive_placeholder on public.properties;

create trigger trg_ai_os_create_property_drive_placeholder
after insert on public.properties
for each row
execute function public.ai_os_create_property_drive_placeholder();

insert into public.property_drive_folders (
  property_id,
  folder_name,
  drive_folder_url,
  drive_folder_id,
  sync_status,
  notes
)
select
  p.id,
  public.ai_os_property_drive_folder_name(
    p.id,
    p.title,
    p.reference_code,
    p.comune,
    p.property_type
  ),
  null,
  null,
  'pending_creation',
  'Cartella Drive preconfigurata automaticamente da AI-OS. Verrà creata sotto la root Drive agenzia.'
from public.properties p
on conflict (property_id) do nothing;
