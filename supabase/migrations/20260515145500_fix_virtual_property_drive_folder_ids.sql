alter table public.property_drive_folder_jobs
add column if not exists drive_folder_id text;

alter table public.property_drive_folder_jobs
add column if not exists updated_at timestamptz default now();

alter table public.property_drive_folder_jobs
add column if not exists processed_at timestamptz;

update public.property_drive_folders
set
  drive_folder_id = null,
  sync_status = 'pending',
  last_error = 'ID virtuale AI-OS rimosso: la cartella deve essere creata realmente su Google Drive.',
  updated_at = now()
where drive_folder_id like 'aios-property-%';

insert into public.property_drive_folder_jobs (
  property_id,
  action,
  status,
  desired_folder_name,
  drive_folder_id,
  created_at,
  updated_at
)
select
  p.id,
  'upsert',
  'pending',
  left(
    regexp_replace(
      coalesce(
        nullif(pdf.folder_name, ''),
        case
          when nullif(p.reference_code, '') is not null
            then p.reference_code || ' - ' || coalesce(nullif(p.title, ''), 'Immobile senza titolo')
          else coalesce(nullif(p.title, ''), 'Immobile senza titolo')
        end
      ),
      '[\\/:*?"<>|]',
      '-',
      'g'
    ),
    140
  ),
  null,
  now(),
  now()
from public.properties p
left join public.property_drive_folders pdf
  on pdf.property_id = p.id
where (
    pdf.property_id is null
    or pdf.drive_folder_id is null
    or trim(pdf.drive_folder_id) = ''
    or pdf.drive_folder_id like 'aios-property-%'
  )
  and not exists (
    select 1
    from public.property_drive_folder_jobs j
    where j.property_id = p.id
      and j.action = 'upsert'
      and j.status in ('pending', 'processing')
  );
