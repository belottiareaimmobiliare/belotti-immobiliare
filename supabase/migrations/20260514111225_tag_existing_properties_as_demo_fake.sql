alter table public.properties
add column if not exists source_tag text not null default 'manual';

alter table public.properties
add column if not exists is_demo boolean not null default false;

alter table public.properties
add column if not exists needs_review boolean not null default false;

alter table public.properties
add column if not exists old_source_url text;

alter table public.properties
add column if not exists imported_at timestamptz;

create unique index if not exists properties_old_source_url_unique_idx
on public.properties (old_source_url)
where old_source_url is not null;

update public.properties
set
  source_tag = 'demo_fake',
  is_demo = true,
  needs_review = true
where source_tag = 'manual'
  and old_source_url is null
  and imported_at is null;
