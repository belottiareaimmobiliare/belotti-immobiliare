'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type MediaType = 'image' | 'plan'

export async function updatePropertyMediaLabel(mediaId: string, label: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('property_media')
    .update({ label })
    .eq('id', mediaId)

  if (error) {
    console.error(error)
    throw new Error('Errore aggiornamento etichetta media')
  }
}

export async function setPropertyMediaAsCover(propertyId: string, mediaId: string) {
  const supabase = await createClient()

  const { error: resetError } = await supabase
    .from('property_media')
    .update({ is_cover: false })
    .eq('property_id', propertyId)
    .eq('media_type', 'image')

  if (resetError) {
    console.error(resetError)
    throw new Error('Errore reset copertina')
  }

  const { data: selectedMedia, error: fetchError } = await supabase
    .from('property_media')
    .select('*')
    .eq('id', mediaId)
    .single()

  if (fetchError || !selectedMedia) {
    console.error(fetchError)
    throw new Error('Errore recupero media selezionato')
  }

  const { error: coverError } = await supabase
    .from('property_media')
    .update({ is_cover: true })
    .eq('id', mediaId)

  if (coverError) {
    console.error(coverError)
    throw new Error('Errore impostazione copertina')
  }

  const { error: propertyError } = await supabase
    .from('properties')
    .update({ main_image: selectedMedia.file_url })
    .eq('id', propertyId)

  if (propertyError) {
    console.error(propertyError)
    throw new Error('Errore aggiornamento main_image proprietà')
  }

  revalidatePath(`/admin/immobili/${propertyId}`)
  revalidatePath('/admin/immobili')
  revalidatePath('/immobili')
}

export async function deletePropertyMedia(
  propertyId: string,
  mediaId: string,
  mediaType: MediaType
) {
  const supabase = await createClient()

  const { data: media, error: fetchError } = await supabase
    .from('property_media')
    .select('*')
    .eq('id', mediaId)
    .single()

  if (fetchError || !media) {
    console.error(fetchError)
    throw new Error('Errore recupero media da eliminare')
  }

  const { error: deleteError } = await supabase
    .from('property_media')
    .delete()
    .eq('id', mediaId)

  if (deleteError) {
    console.error(deleteError)
    throw new Error('Errore eliminazione media')
  }

  if (mediaType === 'image' && media.is_cover) {
    const { data: nextCover } = await supabase
      .from('property_media')
      .select('*')
      .eq('property_id', propertyId)
      .eq('media_type', 'image')
      .order('sort_order', { ascending: true })
      .limit(1)

    if (nextCover && nextCover.length > 0) {
      await supabase
        .from('property_media')
        .update({ is_cover: true })
        .eq('id', nextCover[0].id)

      await supabase
        .from('properties')
        .update({ main_image: nextCover[0].file_url })
        .eq('id', propertyId)
    } else {
      await supabase
        .from('properties')
        .update({ main_image: null })
        .eq('id', propertyId)
    }
  }

  revalidatePath(`/admin/immobili/${propertyId}`)
  revalidatePath('/admin/immobili')
  revalidatePath('/immobili')
}