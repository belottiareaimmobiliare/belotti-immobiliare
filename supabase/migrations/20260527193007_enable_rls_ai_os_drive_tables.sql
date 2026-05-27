-- Enable RLS on AI-OS internal public tables flagged by Supabase Security Advisor.
-- These tables must be accessed only through server-side API routes using the service role.

alter table if exists public.ai_os_custom_folders enable row level security;
alter table if exists public.property_drive_folder_jobs enable row level security;

-- Intentionally no public/authenticated policies here.
-- Supabase service_role bypasses RLS, so server API routes keep working.
-- Browser/anon clients cannot directly read or write these tables.
