create extension if not exists pgcrypto;

create table if not exists public.ai_os_workspace_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid null references auth.users(id) on delete cascade,
  email text null,
  display_name text null,
  role text not null default 'agent',
  can_see_all_properties boolean not null default false,
  is_active boolean not null default true,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_os_workspace_users_role_check check (
    role in (
      'admin',
      'owner',
      'secretariat',
      'agent',
      'photographer',
      'collaborator',
      'client'
    )
  ),
  constraint ai_os_workspace_users_auth_or_email_check check (
    auth_user_id is not null or email is not null
  )
);

create unique index if not exists ai_os_workspace_users_auth_user_id_uidx
on public.ai_os_workspace_users(auth_user_id)
where auth_user_id is not null;

create unique index if not exists ai_os_workspace_users_email_uidx
on public.ai_os_workspace_users(lower(email))
where email is not null;

create table if not exists public.ai_os_property_permissions (
  id uuid primary key default gen_random_uuid(),
  workspace_user_id uuid not null references public.ai_os_workspace_users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  access_level text not null default 'view',
  can_view boolean not null default true,
  can_upload boolean not null default false,
  can_manage boolean not null default false,
  can_sync_public_gallery boolean not null default false,
  can_delete boolean not null default false,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_os_property_permissions_access_level_check check (
    access_level in (
      'view',
      'upload',
      'manage',
      'full'
    )
  ),
  constraint ai_os_property_permissions_unique unique (workspace_user_id, property_id)
);

create index if not exists ai_os_property_permissions_property_id_idx
on public.ai_os_property_permissions(property_id);

create index if not exists ai_os_property_permissions_workspace_user_id_idx
on public.ai_os_property_permissions(workspace_user_id);

alter table public.ai_os_workspace_users enable row level security;
alter table public.ai_os_property_permissions enable row level security;
