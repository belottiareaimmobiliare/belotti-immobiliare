alter table public.ai_os_files
add column if not exists external_url text;

comment on column public.ai_os_files.external_url is
'URL esterno o pubblico usato da AI-OS quando il file non ha storage_path firmabile, ad esempio media già presenti o future sorgenti Drive/import.';

create index if not exists ai_os_files_external_url_idx
on public.ai_os_files(property_id, external_url)
where external_url is not null and is_deleted = false;
