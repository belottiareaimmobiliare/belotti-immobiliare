alter table public.ai_os_share_links
  add column if not exists direct_drive_folder boolean not null default false,
  add column if not exists recipient_email text null,
  add column if not exists created_by uuid null,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists ai_os_share_links_token_uidx
on public.ai_os_share_links(token);

notify pgrst, 'reload schema';
