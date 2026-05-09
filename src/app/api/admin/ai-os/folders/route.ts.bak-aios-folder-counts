import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError, mapPropertyToAIOSFolder } from '@/lib/ai-os'

export async function GET() {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .limit(300)

    if (error) {
      console.error('AI-OS folders error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const folders = (data ?? [])
      .map((property) => mapPropertyToAIOSFolder(property as Record<string, unknown>))
      .filter((folder) => folder.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'it'))

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('AI-OS folders exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento cartelle AI-OS') },
      { status: 500 },
    )
  }
}
