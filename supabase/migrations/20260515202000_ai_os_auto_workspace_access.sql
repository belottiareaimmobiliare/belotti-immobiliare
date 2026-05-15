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
    access_level in ('view', 'upload', 'manage', 'full')
  ),
  constraint ai_os_property_permissions_unique unique (workspace_user_id, property_id)
);

create index if not exists ai_os_property_permissions_property_id_idx
on public.ai_os_property_permissions(property_id);

create index if not exists ai_os_property_permissions_workspace_user_id_idx
on public.ai_os_property_permissions(workspace_user_id);

alter table public.ai_os_workspace_users enable row level security;
alter table public.ai_os_property_permissions enable row level security;

create or replace function public.ai_os_workspace_role_from_profile(profile_role text)
returns text
language sql
immutable
as $$
  select case
    when profile_role = 'administrator' then 'admin'
    when profile_role = 'owner' then 'owner'
    when profile_role = 'secretary' then 'secretariat'
    when profile_role = 'agent' then 'agent'
    when profile_role = 'editor' then 'collaborator'
    else 'agent'
  end;
$$;

create or replace function public.ai_os_workspace_profile_can_see_all(profile_role text)
returns boolean
language sql
immutable
as $$
  select profile_role in ('administrator', 'owner', 'secretary');
$$;

create or replace function public.ai_os_sync_workspace_user_for_profile(profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
  normalized_email text;
  mapped_role text;
  workspace_id uuid;
begin
  select
    id,
    full_name,
    login_email,
    authorized_google_email,
    role,
    is_active
  into p
  from public.profiles
  where id = profile_id;

  if p.id is null then
    return null;
  end if;

  normalized_email := lower(nullif(coalesce(p.login_email, p.authorized_google_email, ''), ''));
  mapped_role := public.ai_os_workspace_role_from_profile(p.role);

  select id
  into workspace_id
  from public.ai_os_workspace_users
  where auth_user_id = p.id
  limit 1;

  if workspace_id is null and normalized_email is not null then
    select id
    into workspace_id
    from public.ai_os_workspace_users
    where lower(email) = normalized_email
    limit 1;
  end if;

  if workspace_id is null then
    insert into public.ai_os_workspace_users (
      auth_user_id,
      email,
      display_name,
      role,
      can_see_all_properties,
      is_active,
      notes
    )
    values (
      p.id,
      normalized_email,
      p.full_name,
      mapped_role,
      public.ai_os_workspace_profile_can_see_all(p.role),
      coalesce(p.is_active, true),
      'Creato automaticamente dal profilo admin.'
    )
    returning id into workspace_id;
  else
    update public.ai_os_workspace_users
    set
      auth_user_id = coalesce(auth_user_id, p.id),
      email = coalesce(normalized_email, email),
      display_name = coalesce(nullif(p.full_name, ''), display_name),
      role = mapped_role,
      can_see_all_properties = public.ai_os_workspace_profile_can_see_all(p.role),
      is_active = coalesce(p.is_active, true),
      updated_at = now()
    where id = workspace_id;
  end if;

  return workspace_id;
end;
$$;

create or replace function public.ai_os_grant_property_access_to_profile(
  profile_id uuid,
  target_property_id uuid,
  target_access_level text default 'manage'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_id uuid;
  safe_access_level text;
  inserted_permission_id uuid;
begin
  if profile_id is null or target_property_id is null then
    return null;
  end if;

  workspace_id := public.ai_os_sync_workspace_user_for_profile(profile_id);

  if workspace_id is null then
    return null;
  end if;

  safe_access_level := case
    when target_access_level in ('view', 'upload', 'manage', 'full') then target_access_level
    else 'manage'
  end;

  insert into public.ai_os_property_permissions (
    workspace_user_id,
    property_id,
    access_level,
    can_view,
    can_upload,
    can_manage,
    can_sync_public_gallery,
    can_delete,
    notes
  )
  values (
    workspace_id,
    target_property_id,
    safe_access_level,
    true,
    safe_access_level in ('upload', 'manage', 'full'),
    safe_access_level in ('manage', 'full'),
    safe_access_level in ('manage', 'full'),
    safe_access_level = 'full',
    'Accesso assegnato automaticamente da AI-OS.'
  )
  on conflict (workspace_user_id, property_id)
  do update set
    access_level = case
      when ai_os_property_permissions.access_level = 'full' then 'full'
      else excluded.access_level
    end,
    can_view = true,
    can_upload = ai_os_property_permissions.can_upload or excluded.can_upload,
    can_manage = ai_os_property_permissions.can_manage or excluded.can_manage,
    can_sync_public_gallery = ai_os_property_permissions.can_sync_public_gallery or excluded.can_sync_public_gallery,
    can_delete = ai_os_property_permissions.can_delete or excluded.can_delete,
    updated_at = now()
  returning id into inserted_permission_id;

  return inserted_permission_id;
end;
$$;

create or replace function public.ai_os_profiles_workspace_sync_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ai_os_sync_workspace_user_for_profile(new.id);
  return new;
end;
$$;

drop trigger if exists trg_ai_os_profiles_workspace_sync on public.profiles;

create trigger trg_ai_os_profiles_workspace_sync
after insert or update of full_name, login_email, authorized_google_email, role, is_active
on public.profiles
for each row
execute function public.ai_os_profiles_workspace_sync_trigger();

create or replace function public.ai_os_property_auto_access_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    perform public.ai_os_grant_property_access_to_profile(new.created_by, new.id, 'manage');
  end if;

  if new.assigned_agent_id is not null then
    perform public.ai_os_grant_property_access_to_profile(new.assigned_agent_id, new.id, 'manage');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ai_os_property_auto_access on public.properties;

create trigger trg_ai_os_property_auto_access
after insert or update of created_by, assigned_agent_id
on public.properties
for each row
execute function public.ai_os_property_auto_access_trigger();

do $$
declare
  p record;
begin
  for p in
    select id from public.profiles
  loop
    perform public.ai_os_sync_workspace_user_for_profile(p.id);
  end loop;
end $$;

do $$
declare
  prop record;
begin
  for prop in
    select id, created_by, assigned_agent_id from public.properties
  loop
    if prop.created_by is not null then
      perform public.ai_os_grant_property_access_to_profile(prop.created_by, prop.id, 'manage');
    end if;

    if prop.assigned_agent_id is not null then
      perform public.ai_os_grant_property_access_to_profile(prop.assigned_agent_id, prop.id, 'manage');
    end if;
  end loop;
end $$;
