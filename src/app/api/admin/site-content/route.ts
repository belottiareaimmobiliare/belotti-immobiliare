import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ABOUT_CONTENT_KEY,
  CONTACTS_CONTENT_KEY,
  HOME_CONTENT_KEY,
} from '@/lib/site-content'

export const dynamic = 'force-dynamic'

const allowedKeys = new Set([
  HOME_CONTENT_KEY,
  ABOUT_CONTENT_KEY,
  CONTACTS_CONTENT_KEY,
])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const key = body?.key
    const value = body?.value

    if (!key || !allowedKeys.has(key) || !value || typeof value !== 'object') {
      return NextResponse.json({ error: 'Payload non valido' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { error } = await supabase.from('site_content').upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Errore durante il salvataggio' },
      { status: 500 }
    )
  }
}
