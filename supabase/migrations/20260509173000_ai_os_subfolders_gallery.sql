-- AI-OS subfolders + gallery linking
-- Ogni file AI-OS può vivere in una sotto-cartella logica:
-- images = immagini
-- docs = documenti e planimetrie
-- Se il file deve comparire anche nella galleria/plans dell'immobile,
-- viene collegato a property_media SENZA duplicare il file nello storage.

alter table public.ai_os_files
add column if not exists folder_type text not null default 'docs';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_os_files_folder_type_check'
  ) then
    alter table public.ai_os_files
    add constraint ai_os_files_folder_type_check
    check (folder_type in ('images', 'docs'));
  end if;
end;
$$;

alter table public.ai_os_files
add column if not exists property_media_id uuid;

alter table public.ai_os_files
add column if not exists is_gallery_visible boolean not null default false;

do $$
begin
  if to_regclass('public.property_media') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'ai_os_files_property_media_id_fkey'
     )
  then
    alter table public.ai_os_files
    add constraint ai_os_files_property_media_id_fkey
    foreign key (property_media_id)
    references public.property_media(id)
    on delete set null;
  end if;
end;
$$;

create index if not exists ai_os_files_property_folder_idx
on public.ai_os_files(property_id, folder_type, is_deleted, created_at desc);

create index if not exists ai_os_files_property_media_id_idx
on public.ai_os_files(property_media_id);

comment on column public.ai_os_files.folder_type is
'Sotto-cartella AI-OS: images oppure docs.';

comment on column public.ai_os_files.property_media_id is
'Se valorizzato, il file AI-OS è collegato alla galleria/planimetrie dell’immobile senza duplicare storage.';

comment on column public.ai_os_files.is_gallery_visible is
'Indica se il file AI-OS è visibile anche nella galleria/planimetrie immobile.';
