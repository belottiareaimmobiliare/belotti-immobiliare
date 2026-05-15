create or replace function public.ai_os_sync_property_media_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_file_url text;
  v_bucket text;
  v_storage_path text;
  v_file_name text;
  v_file_kind text;
  v_folder_type text;
  v_mime_type text;
  v_ext text;
begin
  if tg_op = 'DELETE' then
    update public.ai_os_files
    set
      is_deleted = true,
      updated_at = now()
    where property_media_id = old.id;

    return old;
  end if;

  v_file_url := nullif(trim(coalesce(new.file_url, '')), '');

  if v_file_url is null then
    return new;
  end if;

  v_file_kind := case
    when new.media_type = 'plan' then 'plan'
    else 'image'
  end;

  v_folder_type := case
    when new.media_type = 'plan' then 'plans'
    else 'images'
  end;

  if v_file_url like '%/storage/v1/object/public/%' then
    v_bucket := substring(v_file_url from '/storage/v1/object/public/([^/]+)/');
    v_storage_path := regexp_replace(v_file_url, '^.*?/storage/v1/object/public/[^/]+/', '');
    v_storage_path := regexp_replace(v_storage_path, '\?.*$', '');
  else
    v_bucket := case
      when new.media_type = 'plan' then 'property-plans'
      else 'property-media'
    end;
    v_storage_path := null;
  end if;

  v_file_name := regexp_replace(v_file_url, '^.*/', '');
  v_file_name := regexp_replace(v_file_name, '\?.*$', '');
  v_file_name := replace(v_file_name, '%20', ' ');
  v_file_name := replace(v_file_name, '%C2%B0', '°');

  if nullif(v_file_name, '') is null then
    v_file_name := v_file_kind || '-' || left(new.id::text, 8);
  end if;

  v_ext := lower(regexp_replace(v_file_name, '^.*\.([a-z0-9]+)$', '\1'));

  v_mime_type := case
    when v_ext in ('jpg', 'jpeg') then 'image/jpeg'
    when v_ext = 'png' then 'image/png'
    when v_ext = 'webp' then 'image/webp'
    when v_ext = 'gif' then 'image/gif'
    when v_ext = 'pdf' then 'application/pdf'
    else
      case
        when new.media_type = 'plan' then 'application/pdf'
        else 'image/jpeg'
      end
  end;

  insert into public.ai_os_files (
    property_id,
    uploaded_by,
    file_name,
    file_kind,
    mime_type,
    size_bytes,
    storage_bucket,
    storage_path,
    txt_content,
    is_deleted,
    folder_type,
    property_media_id,
    is_gallery_visible,
    external_url,
    custom_folder_id,
    created_at,
    updated_at
  )
  values (
    new.property_id,
    null,
    v_file_name,
    v_file_kind,
    v_mime_type,
    0,
    v_bucket,
    v_storage_path,
    null,
    false,
    v_folder_type,
    new.id,
    coalesce(new.is_cover, false) or new.media_type = 'image',
    v_file_url,
    null,
    now(),
    now()
  )
  on conflict (property_media_id)
  do update set
    property_id = excluded.property_id,
    file_name = excluded.file_name,
    file_kind = excluded.file_kind,
    mime_type = excluded.mime_type,
    storage_bucket = excluded.storage_bucket,
    storage_path = excluded.storage_path,
    folder_type = excluded.folder_type,
    is_gallery_visible = excluded.is_gallery_visible,
    external_url = excluded.external_url,
    is_deleted = false,
    updated_at = now();

  return new;
end;
$$;

update public.ai_os_files as f
set
  file_name = coalesce(
    nullif(
      replace(
        replace(
          regexp_replace(regexp_replace(pm.file_url, '^.*/', ''), '\?.*$', ''),
          '%20',
          ' '
        ),
        '%C2%B0',
        '°'
      ),
      ''
    ),
    f.file_name
  ),
  storage_bucket = coalesce(
    substring(pm.file_url from '/storage/v1/object/public/([^/]+)/'),
    f.storage_bucket
  ),
  storage_path = case
    when pm.file_url like '%/storage/v1/object/public/%'
      then regexp_replace(
        regexp_replace(pm.file_url, '^.*?/storage/v1/object/public/[^/]+/', ''),
        '\?.*$',
        ''
      )
    else f.storage_path
  end,
  external_url = pm.file_url,
  file_kind = case
    when pm.media_type = 'plan' then 'plan'
    else 'image'
  end,
  folder_type = case
    when pm.media_type = 'plan' then 'plans'
    else 'images'
  end,
  mime_type = case
    when lower(regexp_replace(pm.file_url, '^.*\.([a-z0-9]+)(\?.*)?$', '\1')) in ('jpg', 'jpeg') then 'image/jpeg'
    when lower(regexp_replace(pm.file_url, '^.*\.([a-z0-9]+)(\?.*)?$', '\1')) = 'png' then 'image/png'
    when lower(regexp_replace(pm.file_url, '^.*\.([a-z0-9]+)(\?.*)?$', '\1')) = 'webp' then 'image/webp'
    when lower(regexp_replace(pm.file_url, '^.*\.([a-z0-9]+)(\?.*)?$', '\1')) = 'gif' then 'image/gif'
    when lower(regexp_replace(pm.file_url, '^.*\.([a-z0-9]+)(\?.*)?$', '\1')) = 'pdf' then 'application/pdf'
    else f.mime_type
  end,
  updated_at = now()
from public.property_media pm
join public.properties p on p.id = pm.property_id
where f.property_media_id = pm.id
  and p.source_tag = 'old_site_import'
  and pm.file_url is not null;
