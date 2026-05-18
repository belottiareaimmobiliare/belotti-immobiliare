alter table public.ai_os_share_links
  add column if not exists folder_key text null,
  add column if not exists drive_permission_role text null,
  add column if not exists revoked_at timestamptz null,
  add column if not exists revoked_by uuid null;

create index if not exists ai_os_share_links_property_id_idx
on public.ai_os_share_links(property_id);

create index if not exists ai_os_share_links_recipient_email_idx
on public.ai_os_share_links(recipient_email);

create index if not exists ai_os_share_links_folder_key_idx
on public.ai_os_share_links(folder_key);

notify pgrst, 'reload schema';
