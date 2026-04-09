'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function togglePropertyStatus(
  propertyId: string,
  currentStatus: string
) {
  const supabase = await createClient()

  const nextStatus = currentStatus === 'published' ? 'draft' : 'published'

  const { error } = await supabase
    .from('properties')
    .update({ status: nextStatus })
    .eq('id', propertyId)

  if (error) {
    console.error('Errore aggiornamento stato:', error)
    throw new Error('Errore aggiornamento stato immobile')
  }

  revalidatePath('/admin/immobili')
  revalidatePath('/')
  revalidatePath('/immobili')
}