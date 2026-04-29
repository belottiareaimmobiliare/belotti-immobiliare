'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

type MediaType = 'image' | 'plan'

const PHOTO_COMING_SOON_PLACEHOLDER = '/images/placeholders/foto-in-arrivo.svg'
const NO_PHOTO_PLACEHOLDER = '/images/placeholders/no-foto.svg'

export async function updatePropertyPhotoFlags(
  propertyId: string,
  flags: {
    photoComingSoon: boolean
    noPhotoAvailable: boolean
  }
) {
  const supabase = createServiceClient()

  const photoComingSoon = Boolean(flags.photoComingSoon)
  const noPhotoAvailable = Boolean(flags.noPhotoAvailable)

  const mainImage = noPhotoAvailable
    ? NO_PHOTO_PLACEHOLDER
    : photoComingSoon
      ? PHOTO_COMING_SOON_PLACEHOLDER
      : null

  const { error } = await supabase
    .from('properties')
    .update({
      photo_coming_soon: noPhotoAvailable ? false : photoComingSoon,
      no_photo_available: noPhotoAvailable,
      main_image: mainImage,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', propertyId)

  if (error) {
    console.error(error)
    throw new Error('Errore aggiornamento stato foto immobile')
  }

  revalidatePath(`/admin/immobili/${propertyId}`)
  revalidatePath('/admin/immobili')
  revalidatePath('/immobili')
}

export async function updatePropertyMediaLabel(mediaId: string, label: string) {
  const supabase = createServiceClient()

  const { data: media, error: mediaFetchError } = await supabase
    .from('property_media')
    .select('property_id')
    .eq('id', mediaId)
    .single()

  const { error } = await supabase
    .from('property_media')
    .update({ label })
    .eq('id', mediaId)

  if (error) {
    console.error(error)
    throw new Error('Errore aggiornamento etichetta media')
  }

  if (!mediaFetchError && media?.property_id) {
    await supabase
      .from('properties')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', media.property_id)

    revalidatePath(`/admin/immobili/${media.property_id}`)
  }
}

export async function setPropertyMediaAsCover(propertyId: string, mediaId: string) {
  const supabase = createServiceClient()

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
    .update({
      main_image: selectedMedia.file_url,
      photo_coming_soon: false,
      no_photo_available: false,
      last_activity_at: new Date().toISOString(),
    })
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
  const supabase = createServiceClient()

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
        .update({
          main_image: nextCover[0].file_url,
          photo_coming_soon: false,
          no_photo_available: false,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', propertyId)
    } else {
      await supabase
        .from('properties')
        .update({
          main_image: null,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', propertyId)
    }
  } else {
    await supabase
      .from('properties')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', propertyId)
  }

  revalidatePath(`/admin/immobili/${propertyId}`)
  revalidatePath('/admin/immobili')
  revalidatePath('/immobili')
}

export async function createPropertyMediaRecord(
  propertyId: string,
  input: {
    mediaType: MediaType
    fileUrl: string
    sortOrder: number
    isCover?: boolean
  }
) {
  const supabase = createServiceClient()

  const isCover = Boolean(input.isCover)

  const { error } = await supabase.from('property_media').insert([
    {
      property_id: propertyId,
      media_type: input.mediaType,
      file_url: input.fileUrl,
      label: null,
      sort_order: input.sortOrder,
      is_cover: isCover,
    },
  ])

  if (error) {
    console.error(error)
    throw new Error('Errore inserimento media immobile')
  }

  if (input.mediaType === 'image' && isCover) {
    const { error: propertyError } = await supabase
      .from('properties')
      .update({
        main_image: input.fileUrl,
        photo_coming_soon: false,
        no_photo_available: false,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', propertyId)

    if (propertyError) {
      console.error(propertyError)
      throw new Error('Errore aggiornamento copertina immobile')
    }
  }

  revalidatePath(`/admin/immobili/${propertyId}`)
  revalidatePath('/admin/immobili')
  revalidatePath('/immobili')
}
