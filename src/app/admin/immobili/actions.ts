'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAdminProfile } from '@/lib/admin-auth'

export async function togglePropertyStatus(
  propertyId: string,
  currentStatus: string
) {
  const profile = await requireAdminProfile()
  const service = createServiceClient()

  const nextStatus = currentStatus === 'published' ? 'draft' : 'published'

  const updatePayload =
    nextStatus === 'published'
      ? {
          status: nextStatus,
          published_by: profile.id,
          published_at: new Date().toISOString(),
          updated_by: profile.id,
        }
      : {
          status: nextStatus,
          published_by: null,
          published_at: null,
          updated_by: profile.id,
        }

  const { data: property, error } = await service
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
        ? `Pubblicato immobile: ${property?.title || propertyId}`
        : `Rimesso in bozza immobile: ${property?.title || propertyId}`,
    after_data: property ?? null,
  })

  revalidatePath('/admin/immobili')
  revalidatePath('/admin/kpi')
  revalidatePath('/')
  revalidatePath('/immobili')
}