import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError } from '@/lib/ai-os'

export const dynamic = 'force-dynamic'

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

function cleanEmail(value: unknown) {
  const valueString = cleanString(value).toLowerCase()
  return valueString || null
}

function cleanRole(value: unknown) {
  const role = cleanString(value).toLowerCase()

  if (role === 'owner' || role === 'collaborator' || role === 'client') return role
  return 'photographer'
}

function allowedManagerRole(role: string) {
  return role === 'administrator' || role === 'owner' || role === 'secretary'
}

function makeToken() {
  return randomBytes(24).toString('base64url')
}

function makeExpiresAt(days: unknown) {
  const parsed = Number(days)

  if (!Number.isFinite(parsed) || parsed <= 0) return null

  const date = new Date()
  date.setDate(date.getDate() + Math.min(Math.round(parsed), 365))
  return date.toISOString()
}

function publicShareUrl(request: Request, token: string) {
  const origin = request.headers.get('origin') || new URL(request.url).origin
  return `${origin}/ai-os/share/${token}`
}

export async function GET() {
  try {
    const profile = await requireAdminProfile()

    if (!allowedManagerRole(profile.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const { data: links, error } = await supabase
      .from('ai_os_share_links')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Errore caricamento link AI-OS' },
        { status: 500 },
      )
    }

    const propertyIds = [...new Set((links ?? []).map((link) => link.property_id).filter(Boolean))]
    const propertyById = new Map<string, any>()

    if (propertyIds.length > 0) {
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, reference_code, comune, province, address')
        .in('id', propertyIds)

      for (const property of properties ?? []) {
        propertyById.set(property.id, property)
      }
    }

    return NextResponse.json({
      ok: true,
      links: (links ?? []).map((link) => ({
        ...link,
        property: propertyById.get(link.property_id) ?? null,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento link AI-OS') },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!allowedManagerRole(profile.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const propertyId = cleanString(body?.propertyId)
    const targetFolderName = cleanString(body?.targetFolderName) || 'Bozze Immagini e Video'
    const recipientName = cleanString(body?.recipientName) || null
    const recipientEmail = cleanEmail(body?.recipientEmail)
    const recipientRole = cleanRole(body?.recipientRole)
    const expiresAt = makeExpiresAt(body?.expiresInDays)
    const notes = cleanString(body?.notes) || null

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Seleziona un immobile.' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    const { data: driveFolder, error: driveFolderError } = await supabase
      .from('property_drive_folders')
      .select('property_id, folder_name, drive_folder_id, drive_folder_url, sync_status')
      .eq('property_id', propertyId)
      .maybeSingle()

    if (driveFolderError) {
      return NextResponse.json(
        { error: driveFolderError.message || 'Errore lettura cartella Drive immobile' },
        { status: 500 },
      )
    }

    const driveFolderId = cleanString(driveFolder?.drive_folder_id)

    if (!driveFolderId || driveFolderId.startsWith('aios-property-')) {
      return NextResponse.json(
        { error: 'La cartella Drive reale di questo immobile non è ancora pronta.' },
        { status: 409 },
      )
    }

    const token = makeToken()

    const { data: link, error } = await supabase
      .from('ai_os_share_links')
      .insert({
        token,
        property_id: propertyId,
        drive_folder_id: driveFolderId,
        target_folder_name: targetFolderName,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        recipient_role: recipientRole,
        access_level: 'upload',
        can_view: true,
        can_upload: true,
        is_active: true,
        expires_at: expiresAt,
        created_by: profile.id,
        notes,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Errore creazione link AI-OS' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      link,
      shareUrl: publicShareUrl(request, token),
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore creazione link AI-OS') },
      { status: 500 },
    )
  }
}
