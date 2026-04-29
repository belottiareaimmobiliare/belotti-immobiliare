'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdminProfile } from '@/lib/admin-auth'

type NewsStatus = 'draft' | 'published'
type NewsSourceType = 'manual' | 'facebook'

export type NewsItemInput = {
  source_type?: NewsSourceType
  slug?: string | null
  title?: string | null
  brief?: string | null
  content?: string | null
  author_name?: string | null
  source_name?: string | null
  source_url?: string | null
  external_url?: string | null
  image_url?: string | null
  is_visible?: boolean
  is_pinned?: boolean
  pin_order?: number | null
  sort_order?: number
  status?: NewsStatus
  published_at?: string | null
}

function cleanString(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text || null
}

function cleanNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function cleanBoolean(value: unknown) {
  return value === true
}

export async function createNewsItem(input: NewsItemInput) {
  const profile = await requireAdminProfile()
  const service = createServiceClient()

  const title = cleanString(input.title)
  const slug = cleanString(input.slug)

  if (!title || !slug) {
    throw new Error('Titolo o slug news mancante')
  }

  const status: NewsStatus = input.status === 'draft' ? 'draft' : 'published'
  const now = new Date().toISOString()

  const payload = {
    source_type: input.source_type || 'manual',
    slug,
    title,
    brief: cleanString(input.brief),
    content: cleanString(input.content),
    author_name: cleanString(input.author_name),
    source_name: cleanString(input.source_name),
    source_url: cleanString(input.source_url),
    external_url: cleanString(input.external_url),
    image_url: cleanString(input.image_url),
    is_visible: input.is_visible !== false,
    is_pinned: cleanBoolean(input.is_pinned),
    pin_order: cleanNumber(input.pin_order),
    sort_order: cleanNumber(input.sort_order) ?? 0,
    status,
    published_at: status === 'published' ? input.published_at || now : null,
  }

  const { data, error } = await service
    .from('news_items')
    .insert(payload)
    .select('id, title, slug, status')
    .single()

  if (error || !data) {
    console.error('Errore creazione news:', error)
    throw new Error('Errore creazione news')
  }

  await service.from('activity_log').insert({
    actor_user_id: profile.id,
    actor_username: profile.username,
    actor_full_name: profile.full_name,
    entity_type: 'news',
    entity_id: data.id,
    action: 'create',
    summary: `Creata news: ${title}`,
    after_data: data,
  })

  revalidatePath('/admin/news')
  revalidatePath('/news')
  revalidatePath('/')

  return data
}

export async function updateNewsItem(newsId: string, input: NewsItemInput) {
  const profile = await requireAdminProfile()
  const service = createServiceClient()

  if (!newsId) {
    throw new Error('ID news mancante')
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if ('slug' in input) payload.slug = cleanString(input.slug)
  if ('title' in input) payload.title = cleanString(input.title)
  if ('brief' in input) payload.brief = cleanString(input.brief)
  if ('content' in input) payload.content = cleanString(input.content)
  if ('author_name' in input) payload.author_name = cleanString(input.author_name)
  if ('source_name' in input) payload.source_name = cleanString(input.source_name)
  if ('source_url' in input) payload.source_url = cleanString(input.source_url)
  if ('external_url' in input) payload.external_url = cleanString(input.external_url)
  if ('image_url' in input) payload.image_url = cleanString(input.image_url)
  if ('is_visible' in input) payload.is_visible = input.is_visible === true
  if ('is_pinned' in input) payload.is_pinned = input.is_pinned === true
  if ('pin_order' in input) payload.pin_order = cleanNumber(input.pin_order)
  if ('sort_order' in input) payload.sort_order = cleanNumber(input.sort_order) ?? 0

  if ('status' in input) {
    const status: NewsStatus = input.status === 'draft' ? 'draft' : 'published'
    payload.status = status
    payload.published_at =
      status === 'published' ? input.published_at || new Date().toISOString() : null
  }

  const { data, error } = await service
    .from('news_items')
    .update(payload)
    .eq('id', newsId)
    .select('id, title, slug, status')
    .single()

  if (error || !data) {
    console.error('Errore aggiornamento news:', error)
    throw new Error('Errore aggiornamento news')
  }

  await service.from('activity_log').insert({
    actor_user_id: profile.id,
    actor_username: profile.username,
    actor_full_name: profile.full_name,
    entity_type: 'news',
    entity_id: newsId,
    action: 'update',
    summary: `Aggiornata news: ${data.title || newsId}`,
    after_data: data,
  })

  revalidatePath('/admin/news')
  revalidatePath('/news')
  revalidatePath('/')
}

export async function deleteNewsItem(newsId: string) {
  const profile = await requireAdminProfile()
  const service = createServiceClient()

  if (!newsId) {
    throw new Error('ID news mancante')
  }

  const { data: oldNews } = await service
    .from('news_items')
    .select('id, title')
    .eq('id', newsId)
    .single()

  const { error } = await service.from('news_items').delete().eq('id', newsId)

  if (error) {
    console.error('Errore eliminazione news:', error)
    throw new Error('Errore eliminazione news')
  }

  await service.from('activity_log').insert({
    actor_user_id: profile.id,
    actor_username: profile.username,
    actor_full_name: profile.full_name,
    entity_type: 'news',
    entity_id: newsId,
    action: 'delete',
    summary: `Eliminata news: ${oldNews?.title || newsId}`,
    before_data: oldNews ?? null,
  })

  revalidatePath('/admin/news')
  revalidatePath('/news')
  revalidatePath('/')
}

export async function reorderNewsItems(items: Array<{ id: string; sort_order: number }>) {
  const service = createServiceClient()

  const results = await Promise.all(
    items.map((item) =>
      service
        .from('news_items')
        .update({
          sort_order: item.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
    )
  )

  const failed = results.find((result) => result.error)

  if (failed?.error) {
    console.error('Errore riordino news:', failed.error)
    throw new Error('Errore riordino news')
  }

  revalidatePath('/admin/news')
  revalidatePath('/news')
}

export async function createNewsMediaRecord(input: {
  newsItemId: string
  imageUrl: string
  caption?: string | null
  sortOrder: number
  isCover: boolean
}) {
  const service = createServiceClient()

  const { error } = await service.from('news_media').insert({
    news_item_id: input.newsItemId,
    image_url: input.imageUrl,
    caption: input.caption || null,
    sort_order: input.sortOrder,
    is_cover: input.isCover,
  })

  if (error) {
    console.error('Errore inserimento immagine news:', error)
    throw new Error('Errore inserimento immagine news')
  }

  revalidatePath('/admin/news')
  revalidatePath('/news')
}

export async function setNewsMediaCover(newsItemId: string, mediaId: string) {
  const service = createServiceClient()

  const { error: clearError } = await service
    .from('news_media')
    .update({ is_cover: false })
    .eq('news_item_id', newsItemId)

  if (clearError) {
    console.error('Errore reset copertina news:', clearError)
    throw new Error('Errore reset copertina news')
  }

  const { error } = await service
    .from('news_media')
    .update({ is_cover: true })
    .eq('id', mediaId)

  if (error) {
    console.error('Errore impostazione copertina news:', error)
    throw new Error('Errore impostazione copertina news')
  }

  revalidatePath('/admin/news')
  revalidatePath('/news')
}

export async function deleteNewsMedia(mediaId: string) {
  const service = createServiceClient()

  if (!mediaId) {
    throw new Error('ID media mancante')
  }

  const { error } = await service.from('news_media').delete().eq('id', mediaId)

  if (error) {
    console.error('Errore eliminazione immagine news:', error)
    throw new Error('Errore eliminazione immagine news')
  }

  revalidatePath('/admin/news')
  revalidatePath('/news')
}
