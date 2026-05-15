create or replace function public.aios_clean_drive_folder_name(input_value text)
returns text
language plpgsql
immutable
as $$
declare
  cleaned text;
begin
  cleaned := coalesce(input_value, '');
  cleaned := regexp_replace(cleaned, '[\\/:*?"<>|]', '-', 'g');
  cleaned := regexp_replace(cleaned, '\s+', ' ', 'g');
  cleaned := trim(cleaned);

  if cleaned = '' then
    cleaned := 'Immobile senza titolo';
  end if;

  return left(cleaned, 140);
end;
$$;

create or replace function public.aios_expected_property_drive_folder_name(
  input_reference_code text,
  input_title text
)
returns text
language plpgsql
immutable
as $$
declare
  ref text;
  title_value text;
begin
  ref := trim(coalesce(input_reference_code, ''));
  title_value := trim(coalesce(input_title, ''));

  if title_value = '' then
    title_value := 'Immobile senza titolo';
  end if;

  if ref <> '' then
    return public.aios_clean_drive_folder_name(ref || ' - ' || title_value);
  end if;

  return public.aios_clean_drive_folder_name(title_value);
end;
$$;

create or replace function public.trg_aios_drive_folder_name_follow_property_title()
returns trigger
language plpgsql
as $$
declare
  expected_name text;
begin
  expected_name := public.aios_expected_property_drive_folder_name(
    new.reference_code,
    new.title
  );

  if tg_op = 'INSERT'
    or new.title is distinct from old.title
    or new.reference_code is distinct from old.reference_code
  then
    update public.property_drive_folders
    set
      folder_name = expected_name,
      sync_status = 'pending',
      last_error = null,
      updated_at = now()
    where property_id = new.id;

    delete from public.property_drive_folder_jobs
    where property_id = new.id
      and action = 'upsert'
      and status in ('pending', 'processing', 'failed');

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
      expected_name,
      now(),
      now()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_aios_drive_folder_name_follow_property_title on public.properties;

create trigger trg_aios_drive_folder_name_follow_property_title
after insert or update of title, reference_code
on public.properties
for each row
execute function public.trg_aios_drive_folder_name_follow_property_title();

with expected as (
  select
    pdf.id as drive_row_id,
    pdf.property_id,
    public.aios_expected_property_drive_folder_name(p.reference_code, p.title) as expected_name
  from public.property_drive_folders pdf
  join public.properties p on p.id = pdf.property_id
)
update public.property_drive_folders pdf
set
  folder_name = expected.expected_name,
  sync_status = case
    when pdf.folder_name is distinct from expected.expected_name then 'pending'
    else pdf.sync_status
  end,
  last_error = case
    when pdf.folder_name is distinct from expected.expected_name then null
    else pdf.last_error
  end,
  updated_at = now()
from expected
where pdf.id = expected.drive_row_id
  and pdf.folder_name is distinct from expected.expected_name;
