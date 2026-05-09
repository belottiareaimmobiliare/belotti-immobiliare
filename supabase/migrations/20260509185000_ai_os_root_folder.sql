-- AI-OS root folder
-- Ogni immobile ora ha:
-- root = file sparsi della cartella immobile
-- docs = docs e planimetrie
-- images = immagini collegate alla galleria

alter table public.ai_os_files
alter column folder_type set default 'root';

alter table public.ai_os_files
drop constraint if exists ai_os_files_folder_type_check;

alter table public.ai_os_files
add constraint ai_os_files_folder_type_check
check (folder_type in ('root', 'images', 'docs'));

comment on column public.ai_os_files.folder_type is
'Sotto-cartella AI-OS: root, images oppure docs.';
