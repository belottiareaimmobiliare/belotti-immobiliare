alter table public.properties
add column if not exists import_source text;

alter table public.properties
add column if not exists import_raw jsonb;

create index if not exists properties_source_tag_idx
on public.properties(source_tag);

create index if not exists properties_import_source_idx
on public.properties(import_source);
