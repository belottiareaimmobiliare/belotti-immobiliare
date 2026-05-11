update public.ai_os_drive_settings
set
  large_file_threshold_mb = 45,
  updated_at = now()
where singleton_key = 'default';
