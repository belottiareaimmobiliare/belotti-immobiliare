'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

type LeadStatus = 'new' | 'contacted' | 'closed' | 'archived'

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? '').trim()
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.trim() || null
}

function extractPhone(text: string) {
  const match = text.match(
    /(?:\+39\s*)?(?:3\d{2}|0\d{1,4})[\s./-]?\d{2,4}[\s./-]?\d{2,4}[\s./-]?\d{0,4}/,
  )

  return match?.[0]?.replace(/\s+/g, ' ').trim() || null
}

function extractName(text: string, email: string | null, phone: string | null) {
  let clean = text

  if (email) clean = clean.replace(email, ' ')
  if (phone) clean = clean.replace(phone, ' ')

  const firstLine = clean
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstLine) return 'Contatto da nota'

  const words = firstLine
    .replace(/[,:;|]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)

  return words.join(' ').trim() || 'Contatto da nota'
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const profile = await requireAdminProfile()

  if (profile.role !== 'owner' && !profile.can_manage_properties) {
    throw new Error('Non autorizzato')
  }

  const service = createServiceClient()

  const payload: Record<string, string | null> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'contacted') {
    payload.contacted_at = new Date().toISOString()
  }

  if (status === 'closed' || status === 'archived') {
    payload.closed_at = new Date().toISOString()
  }

  const { error } = await service.from('leads').update(payload).eq('id', leadId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/leads')
  revalidatePath('/admin')
}

export async function createManualLeadFromNote(formData: FormData) {
  const profile = await requireAdminProfile()

  if (profile.role !== 'owner' && !profile.can_manage_properties) {
    throw new Error('Non autorizzato')
  }

  const propertyId = cleanText(formData.get('property_id'))
  const rawNote = cleanText(formData.get('raw_note'))

  if (!propertyId || !rawNote) {
    return
  }

  const supabase = createServiceClient()

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, title, slug')
    .eq('id', propertyId)
    .maybeSingle()

  if (propertyError || !property) {
    console.error('Immobile non trovato per lead nota:', propertyError)
    return
  }

  const email = extractEmail(rawNote)
  const phone = extractPhone(rawNote)
  const fullName = extractName(rawNote, email, phone)

  const { error } = await supabase.from('leads').insert({
    property_id: property.id,
    property_slug: property.slug || null,
    property_title: property.title || null,
    full_name: fullName,
    email,
    phone,
    message: rawNote,
    notes: rawNote,
    internal_note: rawNote,
    status: 'new',
    lead_source: 'manual_note',
    privacy_accepted: false,
    privacy_accepted_at: null,
    privacy_policy_version: null,
    privacy_ip: null,
    privacy_user_agent: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Errore creazione lead da nota:', error)
    return
  }

  revalidatePath('/admin/leads')
  revalidatePath(`/admin/immobili/${property.id}`)
  revalidatePath('/admin')
}