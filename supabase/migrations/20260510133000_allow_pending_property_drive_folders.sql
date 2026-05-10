alter table public.property_drive_folders
alter column drive_folder_url drop not null;

alter table public.property_drive_folders
alter column sync_status set default 'pending_creation';

comment on column public.property_drive_folders.drive_folder_url is
'Link della cartella Google Drive specifica dell’immobile. Può essere vuoto quando AI-OS ha solo preconfigurato il nome cartella da creare.';
