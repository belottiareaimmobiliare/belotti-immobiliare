create or replace function public.enqueue_property_drive_folder_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_name text;
begin
  desired_name := trim(
    concat_ws(
      ' - ',
      nullif(trim(coalesce(new.reference_code, '')), ''),
      nullif(trim(coalesce(new.title, 'Immobile senza titolo')), '')
    )
  );

  if desired_name is null or desired_name = '' then
    desired_name := 'Immobile senza titolo';
  end if;

  insert into public.property_drive_folder_jobs (
    property_id,
    action,
    status,
    desired_folder_name,
    created_at,
    updated_at
  )
  values (
    new.id,
    'upsert',
    'pending',
    desired_name,
    now(),
    now()
  );

  update public.property_drive_folders
  set
    folder_name = desired_name,
    sync_status = case
      when drive_folder_id is null or trim(coalesce(drive_folder_id, '')) = '' then 'pending'
      else 'pending'
    end,
    last_error = null,
    updated_at = now()
  where property_id = new.id
    and coalesce(folder_name, '') is distinct from desired_name;

  return new;
end;
$$;

drop trigger if exists trg_property_drive_folder_upsert on public.properties;

create trigger trg_property_drive_folder_upsert
after insert or update of title, reference_code, status, source_tag
on public.properties
for each row
execute function public.enqueue_property_drive_folder_upsert();

insert into public.property_drive_folder_jobs (
  property_id,
  action,
  status,
  desired_folder_name,
  created_at,
  updated_at
)
select
  p.id,
  'upsert',
  'pending',
  trim(
    concat_ws(
      ' - ',
      nullif(trim(coalesce(p.reference_code, '')), ''),
      nullif(trim(coalesce(p.title, 'Immobile senza titolo')), '')
    )
  ),
  now(),
  now()
from public.properties p
left join public.property_drive_folders f on f.property_id = p.id
where f.id is not null
  and coalesce(f.folder_name, '') is distinct from trim(
    concat_ws(
      ' - ',
      nullif(trim(coalesce(p.reference_code, '')), ''),
      nullif(trim(coalesce(p.title, 'Immobile senza titolo')), '')
    )
  );

update public.property_drive_folders f
set
  folder_name = trim(
    concat_ws(
      ' - ',
      nullif(trim(coalesce(p.reference_code, '')), ''),
      nullif(trim(coalesce(p.title, 'Immobile senza titolo')), '')
    )
  ),
  sync_status = 'pending',
  last_error = null,
  updated_at = now()
from public.properties p
where p.id = f.property_id
  and coalesce(f.folder_name, '') is distinct from trim(
    concat_ws(
      ' - ',
      nullif(trim(coalesce(p.reference_code, '')), ''),
      nullif(trim(coalesce(p.title, 'Immobile senza titolo')), '')
    )
  );
