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

function getMissingQualityFields(property: PropertyQuality) {
  const missing: string[] = []

  if (!property.title?.trim()) missing.push('titolo')
  if (!property.description?.trim()) missing.push('descrizione')
  if (!property.price) missing.push('prezzo')
  if (!property.comune?.trim()) missing.push('comune')
  if (!property.contract_type?.trim()) missing.push('contratto')
  if (!property.property_type?.trim()) missing.push('tipologia')

  return missing
}

export async function togglePropertyStatus(
  propertyId: string,
  currentStatus: string
) {
  const profile = await requireAdminProfile()
  const service = createServiceClient()

  const nextStatus = currentStatus === 'published' ? 'draft' : 'published'

  const { data: property, error: propertyError } = await service
    .from('properties')
    .select('id, title, description, price, comune, contract_type, property_type, status')
    .eq('id', propertyId)
    .single()

  if (propertyError || !property) {
    console.error('Errore lettura immobile:', propertyError)
    throw new Error('Immobile non trovato')
  }

  if (nextStatus === 'published') {
    const missing = getMissingQualityFields(property as PropertyQuality)

    if (missing.length > 0) {
      throw new Error(`Impossibile pubblicare: mancano ${missing.join(', ')}.`)
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