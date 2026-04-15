import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type FacebookPost = {
  id: string
  message?: string
  created_time?: string
  permalink_url?: string
  full_picture?: string
  attachments?: {
    data?: Array<{
      media_type?: string
      media?: {
        image?: {
          src?: string
        }
      }
      url?: string
      subattachments?: {
        data?: Array<{
          media?: {
            image?: {
              src?: string
            }
          }
          media_type?: string
          url?: string
        }>
      }
    }>
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function getLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function extractTitle(message: string) {
  const lines = getLines(message)
  if (lines.length === 0) return 'Post Facebook'
  return lines[0].slice(0, 120)
}

function extractBrief(message: string) {
  const lines = getLines(message)
  if (lines.length <= 1) return message.slice(0, 220)
  return lines.slice(1).join(' ').slice(0, 260)
}

function messageToHtml(message: string) {
  const escaped = message
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

  return escaped
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p>${line}</p>`)
    .join('')
}

function extractImages(post: FacebookPost): string[] {
  const images: string[] = []

  if (post.full_picture) {
    images.push(post.full_picture)
  }

  const attachments = post.attachments?.data || []

  for (const attachment of attachments) {
    const directImage = attachment.media?.image?.src
    if (directImage) images.push(directImage)

    const subattachments = attachment.subattachments?.data || []
    for (const sub of subattachments) {
      const subImage = sub.media?.image?.src
      if (subImage) images.push(subImage)
    }
  }

  return [...new Set(images)].slice(0, 10)
}

async function updateSyncStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  settingsId: string,
  payload: {
    last_sync_status: string
    last_sync_message: string
    last_sync_at?: string
  }
) {
  await supabase
    .from('news_settings')
    .update({
      ...payload,
      last_sync_at: payload.last_sync_at || new Date().toISOString(),
    })
    .eq('id', settingsId)
}

export async function POST() {
  const supabase = await createClient()

  const { data: settings, error: settingsError } = await supabase
    .from('news_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (settingsError || !settings) {
    return NextResponse.json(
      { ok: false, message: 'Configurazione news_settings non trovata.' },
      { status: 400 }
    )
  }

  if (!settings.facebook_sync_enabled) {
    await updateSyncStatus(supabase, settings.id, {
      last_sync_status: 'disabled',
      last_sync_message: 'Sincronizzazione Facebook disattivata.',
    })

    return NextResponse.json({
      ok: false,
      message: 'Sincronizzazione disattivata.',
    })
  }

  if (!settings.facebook_page_id || !settings.facebook_access_token) {
    await updateSyncStatus(supabase, settings.id, {
      last_sync_status: 'error',
      last_sync_message: 'Mancano Facebook Page ID o Access Token.',
    })

    return NextResponse.json(
      {
        ok: false,
        message: 'Mancano Facebook Page ID o Access Token.',
      },
      { status: 400 }
    )
  }

  try {
    const endpoint = new URL(
      `https://graph.facebook.com/v25.0/${settings.facebook_page_id}/posts`
    )

    endpoint.searchParams.set(
      'fields',
      'id,message,created_time,permalink_url,full_picture,attachments{media_type,media,url,subattachments}'
    )
    endpoint.searchParams.set('limit', '20')
    endpoint.searchParams.set('access_token', settings.facebook_access_token)

    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      cache: 'no-store',
    })

    const payload = await response.json()

    if (!response.ok) {
      const errorMessage =
        payload?.error?.message || 'Errore nella lettura dei post Facebook.'

      await updateSyncStatus(supabase, settings.id, {
        last_sync_status: 'error',
        last_sync_message: errorMessage,
      })

      return NextResponse.json(
        {
          ok: false,
          message: errorMessage,
        },
        { status: 400 }
      )
    }

    const posts = (payload?.data || []) as FacebookPost[]
    let createdCount = 0
    let updatedCount = 0

    for (const post of posts) {
      const message = (post.message || '').trim()
      const title = extractTitle(message || 'Post Facebook')
      const brief = extractBrief(message || 'Contenuto Facebook importato.')
      const content = messageToHtml(message || brief)
      const slugBase = slugify(title)
      const slug = `${slugBase || 'post-facebook'}-${post.id.split('_').pop() || post.id}`
      const images = extractImages(post)
      const coverImage = images[0] || null

      const { data: existing } = await supabase
        .from('news_items')
        .select('id')
        .eq('facebook_post_id', post.id)
        .maybeSingle()

      const basePayload = {
        source_type: 'facebook' as const,
        facebook_post_id: post.id,
        slug,
        title,
        brief: brief || null,
        content,
        image_url: coverImage,
        external_url: post.permalink_url || null,
        source_name: settings.facebook_page_name || 'Facebook',
        source_url: settings.facebook_page_url || null,
        author_name: settings.facebook_page_name || 'Facebook',
        is_visible: true,
        status: 'published' as const,
        published_at: post.created_time || new Date().toISOString(),
      }

      let newsItemId: string

      if (existing?.id) {
        const { error } = await supabase
          .from('news_items')
          .update(basePayload)
          .eq('id', existing.id)

        if (error) {
          console.error('Errore update news facebook:', error)
          continue
        }

        newsItemId = existing.id
        updatedCount += 1

        await supabase.from('news_media').delete().eq('news_item_id', newsItemId)
      } else {
        const { data: inserted, error } = await supabase
          .from('news_items')
          .insert(basePayload)
          .select('id')
          .single()

        if (error || !inserted) {
          console.error('Errore insert news facebook:', error)
          continue
        }

        newsItemId = inserted.id
        createdCount += 1
      }

      if (images.length > 0) {
        const mediaRows = images.slice(0, 10).map((imageUrl, index) => ({
          news_item_id: newsItemId,
          image_url: imageUrl,
          caption: null,
          sort_order: index + 1,
          is_cover: index === 0,
        }))

        const { error: mediaError } = await supabase
          .from('news_media')
          .insert(mediaRows)

        if (mediaError) {
          console.error('Errore insert media facebook:', mediaError)
        }
      }
    }

    const finalMessage = `Sync completata. Creati: ${createdCount}, aggiornati: ${updatedCount}, letti: ${posts.length}.`

    await updateSyncStatus(supabase, settings.id, {
      last_sync_status: 'success',
      last_sync_message: finalMessage,
    })

    return NextResponse.json({
      ok: true,
      message: finalMessage,
      createdCount,
      updatedCount,
      totalFetched: posts.length,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Errore imprevisto sync Facebook.'

    await updateSyncStatus(supabase, settings.id, {
      last_sync_status: 'error',
      last_sync_message: message,
    })

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 }
    )
  }
}