import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

export async function GET() {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase.rpc('get_ai_os_quota_status')

    if (error) {
      console.error('AI-OS quota error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const quota = Array.isArray(data) ? data[0] : data

    return NextResponse.json({
      quota: quota ?? {
        total_bytes: 0,
        warn_total_bytes: 681574400,
        max_total_bytes: 838860800,
        remaining_total_bytes: 838860800,
        total_files: 0,
        max_total_files: 800,
        usage_percent: 0,
        is_warning: false,
        is_blocked: false,
      },
    })
  } catch (error) {
    console.error('AI-OS quota exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento quota AI-OS') },
      { status: 500 },
    )
  }
}
