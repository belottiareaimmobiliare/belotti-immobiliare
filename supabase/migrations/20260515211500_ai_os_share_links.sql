create extension if not exists pgcrypto;

create table if not exists public.ai_os_share_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  property_id uuid not null references public.properties(id) on delete cascade,
  drive_folder_id text not null,
  target_folder_name text not null default 'Bozze Immagini e Video',
  recipient_name text null,
  recipient_email text null,
  recipient_role text not null default 'photographer',
  access_level text not null default 'upload',
  can_view boolean not null default true,
  can_upload boolean not null default true,
  is_active boolean not null default true,
  max_upload_bytes bigint not null default 4194304,
  expires_at timestamptz null,
  use_count integer not null default 0,
  last_used_at timestamptz null,
  created_by uuid null references public.profiles(id) on delete set null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_os_share_links_role_check check (
    recipient_role in ('photographer', 'owner', 'collaborator', 'client')
  ),
  constraint ai_os_share_links_access_level_check check (
    access_level in ('view', 'upload')
  )
);

create index if not exists ai_os_share_links_property_id_idx
on public.ai_os_share_links(property_id);

create index if not exists ai_os_share_links_token_idx
on public.ai_os_share_links(token);

alter table public.ai_os_share_links enable row level security;
