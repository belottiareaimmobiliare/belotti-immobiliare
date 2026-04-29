import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

export const revalidate = 3600

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://belotti-immobiliare.vercel.app'

type SitemapEntry = MetadataRoute.Sitemap[number]

function absoluteUrl(pathname: string) {
  return `${siteUrl}${pathname}`
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
    },
  })
}

async function getPropertyUrls(): Promise<SitemapEntry[]> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('properties')
    .select('slug, updated_at, created_at')
    .eq('status', 'published')
    .not('slug', 'is', null)

  if (error || !data) {
    console.warn('Sitemap properties error:', error?.message)
    return []
  }

  return data
    .filter((property) => property.slug)
    .map((property) => ({
      url: absoluteUrl(`/immobili/${property.slug}`),
      lastModified: property.updated_at || property.created_at || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
}

async function getNewsUrls(): Promise<SitemapEntry[]> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('news')
    .select('slug, updated_at, published_at, created_at')
    .eq('status', 'published')
    .not('slug', 'is', null)

  if (error || !data) {
    console.warn('Sitemap news error:', error?.message)
    return []
  }

  return data
    .filter((article) => article.slug)
    .map((article) => ({
      url: absoluteUrl(`/news/${article.slug}`),
      lastModified:
        article.updated_at || article.published_at || article.created_at || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
}

async function getPdfUrls(): Promise<SitemapEntry[]> {
  const pdfDir = path.join(process.cwd(), 'public', 'pdf')

  try {
    const files = await fs.readdir(pdfDir)

    const pdfFiles = files.filter((file) =>
      file.toLowerCase().endsWith('.pdf')
    )

    const entries = await Promise.all(
      pdfFiles.map(async (file) => {
        const stat = await fs.stat(path.join(pdfDir, file))

        return {
          url: absoluteUrl(`/pdf/${encodeURIComponent(file)}`),
          lastModified: stat.mtime,
          changeFrequency: 'monthly' as const,
          priority: 0.5,
        }
      })
    )

    return entries
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticUrls: SitemapEntry[] = [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/immobili'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/immobili/mappa-area'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/chi-siamo'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/gianfederico-belotti'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/contatti'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/news'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/privacy'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/cookie'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/preferenze-cookie'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const [propertyUrls, newsUrls, pdfUrls] = await Promise.all([
    getPropertyUrls(),
    getNewsUrls(),
    getPdfUrls(),
  ])

  return [
    ...staticUrls,
    ...propertyUrls,
    ...newsUrls,
    ...pdfUrls,
  ]
}
