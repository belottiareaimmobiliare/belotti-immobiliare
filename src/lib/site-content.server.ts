import { createClient } from '@/lib/supabase/server'
import {
  ABOUT_CONTENT_KEY,
  CONTACTS_CONTENT_KEY,
  HOME_CONTENT_KEY,
  defaultAboutContent,
  defaultContactsContent,
  defaultHomeContent,
  type AboutContent,
  type ContactsContent,
  type HomeContent,
} from '@/lib/site-content'

async function readContent<T>(key: string, fallback: T): Promise<T> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error || !data?.value || typeof data.value !== 'object') {
    return fallback
  }

  return {
    ...fallback,
    ...(data.value as Record<string, unknown>),
  } as T
}

export async function getHomeContent() {
  return readContent<HomeContent>(HOME_CONTENT_KEY, defaultHomeContent)
}

export async function getAboutContent() {
  return readContent<AboutContent>(ABOUT_CONTENT_KEY, defaultAboutContent)
}

export async function getContactsContent() {
  return readContent<ContactsContent>(CONTACTS_CONTENT_KEY, defaultContactsContent)
}
