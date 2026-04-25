'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdminProfile } from '@/lib/admin-auth'

type PropertyQuality = {
  id: string
  title: string | null
  description: string | null
  price: number | null
  comune: string | null
  contract_type: string | null
  property_type: string | null
  status: string | null
}

function getMissingQualityFields(property: PropertyQuality, imageCount: number) {
  const missing: string[] = []

  if (!property.title?.trim()) missing.push('titolo')
  if (!property.description?.trim()) missing.push('descrizione')
  if (!property.price) missing.push('prezzo')
  if (!property.comune?.trim()) missing.push('comune')
  if (!property.contract_type?.trim()) missing.push('contratto')
  if (!property.property_type?.trim()) missing.push('tipologia')
  if (imageCount < 1) missing.push('almeno 1 immagine')

  return missing
}

export async function togglePropertyStatus(
  propertyId: string,
  currentStatus: string
) {
  const profile = await requireAdminProfile()
  const service = createServiceClient()

  const nextStatus = currentStatus === 'published' ? 'draft' : 'published'

  const [{ data: property, error: propertyError }, { count: imageCount, error: mediaError }] =
    await Promise.all([
      service
        .from('properties')
        .select('id, title, description, price, comune, contract_type, property_type, status')
        .eq('id', propertyId)
        .single(),

      service
        .from('property_media')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', propertyId)
        .eq('media_type', 'image'),
    ])

  if (propertyError || !property) {
    console.error('Errore lettura immobile:', propertyError)
    throw new Error('Immobile non trovato')
  }

  if (mediaError) {
    console.error('Errore controllo immagini:', mediaError)
    throw new Error('Errore controllo immagini immobile')
  }

  if (nextStatus === 'published') {
    const missing = getMissingQualityFields(
      property as PropertyQuality,
      imageCount ?? 0
    )

    if (missing.length > 0) {
      throw new Error(
        `Impossibile pubblicare: mancano ${missing.join(', ')}.`
      )
    }
  }

  const updatePayload =
    nextStatus === 'published'
      ? {
          status: nextStatus,
          published_by: profile.id,
          published_at: new Date().toISOString(),
          updated_by: profile.id,
          last_activity_at: new Date().toISOString(),
        }
      : {
          status: nextStatus,
          published_by: null,
          published_at: null,
          updated_by: profile.id,
          last_activity_at: new Date().toISOString(),
        }

  const { data: updatedProperty, error } = await service
    .from('properties')
    .update(updatePayload)
    .eq('id', propertyId)
    .select('id, title, status')
    .single()

  if (error) {
    console.error('Errore aggiornamento stato:', error)
    throw new Error('Errore aggiornamento stato immobile')
  }

  await service.from('activity_log').insert({
    actor_user_id: profile.id,
    actor_username: profile.username,
    actor_full_name: profile.full_name,
    entity_type: 'property',
    entity_id: propertyId,
    action: nextStatus === 'published' ? 'publish' : 'unpublish',
    summary:
      nextStatus === 'published'
        ? `Pubblicato immobile: ${updatedProperty?.title || propertyId}`
        : `Rimesso in bozza immobile: ${updatedProperty?.title || propertyId}`,
    after_data: updatedProperty ?? null,
  })

  revalidatePath('/admin/immobili')
  revalidatePath('/admin/kpi')
  revalidatePath('/')
  revalidatePath('/immobili')
}