'use client'

import { ChangeEvent, DragEvent, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  createPropertyMediaRecord,
  deletePropertyMedia,
  setPropertyMediaAsCover,
  updatePropertyMediaLabel,
  updatePropertyPhotoFlags,
} from '../../app/admin/immobili/[id]/media-actions'

type PropertyMediaItem = {
  id: string
  property_id: string
  media_type: 'image' | 'plan'
  file_url: string
  label: string | null
  sort_order: number | null
  is_cover: boolean | null
}

type Props = {
  propertyId: string
  media: PropertyMediaItem[]
  photoComingSoon?: boolean
  noPhotoAvailable?: boolean
}

export default function PropertyMediaManagerV2({
  propertyId,
  media,
  photoComingSoon = false,
  noPhotoAvailable = false,
}: Props) {
  const supabase = createClient()
  const router = useRouter()

  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const planInputRef = useRef<HTMLInputElement | null>(null)

  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [isUploadingPlans, setIsUploadingPlans] = useState(false)
  const [imagesDragActive, setImagesDragActive] = useState(false)
  const [plansDragActive, setPlansDragActive] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const [pendingLabelId, setPendingLabelId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [pendingCoverId, setPendingCoverId] = useState<string | null>(null)
  const [pendingPhotoFlags, setPendingPhotoFlags] = useState(false)

  const [, startTransition] = useTransition()

  const images = media
    .filter((item) => item.media_type === 'image')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const plans = media
    .filter((item) => item.media_type === 'plan')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const uploadFile = async (file: File, mediaType: 'image' | 'plan') => {
    const extension = file.name.split('.').pop() || (mediaType === 'plan' ? 'pdf' : 'jpg')
    const fileName = `${mediaType}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`

    const bucketName = mediaType === 'image' ? 'property-media' : 'property-plans'
    const filePath = `properties/${propertyId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
    return data.publicUrl
  }

  const insertMediaRecord = async (
    mediaType: 'image' | 'plan',
    fileUrl: string,
    sortOrder: number,
    isCover = false
  ) => {
    await createPropertyMediaRecord(propertyId, {
      mediaType,
      fileUrl,
      sortOrder,
      isCover,
    })
  }

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    )

    if (validFiles.length === 0) {
      alert('Carica almeno un file immagine valido.')
      return
    }

    try {
      setIsUploadingImages(true)
      setUploadedCount(0)
      setTotalCount(validFiles.length)

      const existingImagesCount = images.length

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const publicUrl = await uploadFile(file, 'image')

        const shouldBeCover = existingImagesCount === 0 && i === 0
        await insertMediaRecord(
          'image',
          publicUrl,
          existingImagesCount + i + 1,
          shouldBeCover
        )

        setUploadedCount(i + 1)
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Errore durante il caricamento delle immagini.')
    } finally {
      setIsUploadingImages(false)
      setImagesDragActive(false)
      setUploadedCount(0)
      setTotalCount(0)
    }
  }

  const handlePlanFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter(
      (file) => file.type === 'application/pdf' || file.type.startsWith('image/')
    )

    if (validFiles.length === 0) {
      alert('Carica almeno un PDF o un’immagine valida.')
      return
    }

    try {
      setIsUploadingPlans(true)
      setUploadedCount(0)
      setTotalCount(validFiles.length)

      const existingPlansCount = plans.length

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const publicUrl = await uploadFile(file, 'plan')
        await insertMediaRecord('plan', publicUrl, existingPlansCount + i + 1, false)
        setUploadedCount(i + 1)
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Errore durante il caricamento delle planimetrie.')
    } finally {
      setIsUploadingPlans(false)
      setPlansDragActive(false)
      setUploadedCount(0)
      setTotalCount(0)
    }
  }

  const onImagesInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleImageFiles(e.target.files)
  }

  const onPlansInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handlePlanFiles(e.target.files)
  }

  const onImagesDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    handleImageFiles(e.dataTransfer.files)
  }

  const onPlansDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    handlePlanFiles(e.dataTransfer.files)
  }

  const handleLabelSave = (mediaId: string, label: string) => {
    setPendingLabelId(mediaId)

    startTransition(async () => {
      try {
        await updatePropertyMediaLabel(mediaId, label)
        router.refresh()
      } catch (error) {
        console.error(error)
        alert('Errore aggiornamento etichetta.')
      } finally {
        setPendingLabelId(null)
      }
    })
  }

  const handleSetCover = (mediaId: string) => {
    setPendingCoverId(mediaId)

    startTransition(async () => {
      try {
        await setPropertyMediaAsCover(propertyId, mediaId)
        router.refresh()
      } catch (error) {
        console.error(error)
        alert('Errore impostazione copertina.')
      } finally {
        setPendingCoverId(null)
      }
    })
  }

  const handleDelete = (mediaId: string, mediaType: 'image' | 'plan') => {
    setPendingDeleteId(mediaId)

    startTransition(async () => {
      try {
        await deletePropertyMedia(propertyId, mediaId, mediaType)
        router.refresh()
      } catch (error) {
        console.error(error)
        alert('Errore eliminazione file.')
      } finally {
        setPendingDeleteId(null)
      }
    })
  }


  const handlePhotoFlagChange = (
    nextFlags: {
      photoComingSoon: boolean
      noPhotoAvailable: boolean
    }
  ) => {
    setPendingPhotoFlags(true)

    startTransition(async () => {
      try {
        await updatePropertyPhotoFlags(propertyId, nextFlags)
        router.refresh()
      } catch (error) {
        console.error(error)
        alert('Errore aggiornamento stato foto.')
      } finally {
        setPendingPhotoFlags(false)
      }
    })
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="theme-admin-card rounded-3xl p-5 md:p-6">
        <div className="mb-4">
          <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
            Immagini immobile
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--site-text)]">
            Foto e copertina
          </h3>
          <p className="theme-admin-muted mt-2 text-sm">
            Trascina qui una o più immagini oppure clicca per caricarle. Per ogni file puoi scrivere a mano l’etichetta che vuoi.
          </p>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onImagesInputChange}
        />

        <div
          onClick={() => !isUploadingImages && imageInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            if (!isUploadingImages) setImagesDragActive(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setImagesDragActive(false)
          }}
          onDrop={onImagesDrop}
          className={`relative cursor-pointer rounded-3xl border border-dashed p-4 transition ${
            imagesDragActive
              ? 'border-[var(--site-border-strong)] bg-[var(--site-surface-2)]'
              : 'border-[var(--site-border)] bg-[var(--site-surface-strong)]'
          }`}
        >
          <div className="theme-admin-card flex min-h-[140px] flex-col items-center justify-center rounded-2xl px-6 text-center">
            <p className="theme-admin-faint text-sm uppercase tracking-[0.18em]">
              Spazio immagini
            </p>

            <p className="theme-admin-muted mt-3 text-sm">
              {isUploadingImages
                ? `Caricamento immagini ${uploadedCount}/${totalCount}...`
                : 'Trascina qui le foto oppure clicca per selezionarle'}
            </p>
          </div>

          {isUploadingImages && (
            <div className="absolute inset-4 flex flex-col items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="mt-4 text-sm font-medium text-white">
                Elaborazione immagini...
              </p>
              <p className="mt-2 text-sm text-white/70">
                {uploadedCount} / {totalCount} file caricati
              </p>
              <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
                <div className="h-full animate-pulse rounded-full bg-white" />
              </div>
            </div>
          )}
        </div>


        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              handlePhotoFlagChange({
                photoComingSoon: !photoComingSoon,
                noPhotoAvailable: false,
              })
            }
            disabled={pendingPhotoFlags}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition disabled:opacity-60 ${
              photoComingSoon
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                : 'border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text-muted)]'
            }`}
          >
            <span className="block font-semibold text-[var(--site-text)]">
              Foto in arrivo
            </span>
            <span className="mt-1 block text-xs opacity-75">
              Usa il placeholder “Foto in arrivo” finché non vengono caricate immagini reali.
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              handlePhotoFlagChange({
                photoComingSoon: false,
                noPhotoAvailable: !noPhotoAvailable,
              })
            }
            disabled={pendingPhotoFlags}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition disabled:opacity-60 ${
              noPhotoAvailable
                ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
                : 'border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text-muted)]'
            }`}
          >
            <span className="block font-semibold text-[var(--site-text)]">
              Nessuna foto prevista
            </span>
            <span className="mt-1 block text-xs opacity-75">
              Per box, ruderi o immobili dove non sono disponibili foto.
            </span>
          </button>
        </div>

        {images.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {images.map((item, index) => (
              <MediaCard
                key={item.id}
                item={item}
                index={index}
                onSaveLabel={handleLabelSave}
                onSetCover={handleSetCover}
                onDelete={handleDelete}
                isSavingLabel={pendingLabelId === item.id}
                isSettingCover={pendingCoverId === item.id}
                isDeleting={pendingDeleteId === item.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="theme-admin-card rounded-3xl p-5 md:p-6">
        <div className="mb-4">
          <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
            Planimetrie e documenti grafici
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--site-text)]">
            Planimetrie
          </h3>
          <p className="theme-admin-muted mt-2 text-sm">
            Puoi caricare più PDF o immagini e scrivere etichette libere come “bagno”, “garage”, “cantina”, “cucina”, “piano box”.
          </p>
        </div>

        <input
          ref={planInputRef}
          type="file"
          accept=".pdf,image/*"
          multiple
          className="hidden"
          onChange={onPlansInputChange}
        />

        <div
          onClick={() => !isUploadingPlans && planInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            if (!isUploadingPlans) setPlansDragActive(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setPlansDragActive(false)
          }}
          onDrop={onPlansDrop}
          className={`relative cursor-pointer rounded-3xl border border-dashed p-4 transition ${
            plansDragActive
              ? 'border-[var(--site-border-strong)] bg-[var(--site-surface-2)]'
              : 'border-[var(--site-border)] bg-[var(--site-surface-strong)]'
          }`}
        >
          <div className="theme-admin-card flex min-h-[140px] flex-col items-center justify-center rounded-2xl px-6 text-center">
            <p className="theme-admin-faint text-sm uppercase tracking-[0.18em]">
              Spazio planimetrie
            </p>

            <p className="theme-admin-muted mt-3 text-sm">
              {isUploadingPlans
                ? `Caricamento planimetrie ${uploadedCount}/${totalCount}...`
                : 'Trascina qui PDF o immagini oppure clicca per selezionarli'}
            </p>
          </div>

          {isUploadingPlans && (
            <div className="absolute inset-4 flex flex-col items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="mt-4 text-sm font-medium text-white">
                Elaborazione planimetrie...
              </p>
              <p className="mt-2 text-sm text-white/70">
                {uploadedCount} / {totalCount} file caricati
              </p>
              <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
                <div className="h-full animate-pulse rounded-full bg-white" />
              </div>
            </div>
          )}
        </div>

        {plans.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((item, index) => (
              <MediaCard
                key={item.id}
                item={item}
                index={index}
                onSaveLabel={handleLabelSave}
                onSetCover={handleSetCover}
                onDelete={handleDelete}
                isSavingLabel={pendingLabelId === item.id}
                isSettingCover={false}
                isDeleting={pendingDeleteId === item.id}
                isPlan
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MediaCard({
  item,
  index,
  onSaveLabel,
  onSetCover,
  onDelete,
  isSavingLabel,
  isSettingCover,
  isDeleting,
  isPlan = false,
}: {
  item: PropertyMediaItem
  index: number
  onSaveLabel: (mediaId: string, label: string) => void
  onSetCover: (mediaId: string) => void
  onDelete: (mediaId: string, mediaType: 'image' | 'plan') => void
  isSavingLabel: boolean
  isSettingCover: boolean
  isDeleting: boolean
  isPlan?: boolean
}) {
  const [label, setLabel] = useState(item.label || '')
  const isPdf = item.file_url.toLowerCase().includes('.pdf')

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)]">
      {isPlan && isPdf ? (
        <div className="flex h-48 items-center justify-center border-b border-[var(--site-border)] bg-[var(--site-surface-2)] text-sm text-[var(--site-text-muted)]">
          PDF planimetria
        </div>
      ) : (
        <div
          className="h-48 border-b border-[var(--site-border)] bg-cover bg-center"
          style={{ backgroundImage: `url('${item.file_url}')` }}
        />
      )}

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="theme-admin-faint text-xs uppercase tracking-[0.18em]">
            {isPlan ? `Plan ${index + 1}` : `Foto ${index + 1}`}
          </p>

          {item.is_cover && !isPlan && (
            <span className="theme-admin-chip rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]">
              Copertina
            </span>
          )}
        </div>

        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={
            isPlan
              ? 'Scrivi etichetta libera (es. garage)'
              : 'Scrivi etichetta libera (es. cucina)'
          }
          className="theme-admin-input w-full rounded-xl px-3 py-2 text-sm"
        />

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => onSaveLabel(item.id, label)}
            disabled={isSavingLabel}
            className="theme-admin-button-secondary rounded-xl px-3 py-2 text-sm transition hover:opacity-95"
          >
            {isSavingLabel ? 'Salvataggio etichetta...' : 'Salva etichetta'}
          </button>

          {!isPlan && (
            <button
              type="button"
              onClick={() => onSetCover(item.id)}
              disabled={isSettingCover || Boolean(item.is_cover)}
              className="theme-admin-button-secondary rounded-xl px-3 py-2 text-sm transition hover:opacity-95 disabled:opacity-50"
            >
              {item.is_cover
                ? 'Copertina attiva'
                : isSettingCover
                  ? 'Impostazione copertina...'
                  : 'Imposta come copertina'}
            </button>
          )}

          <a
            href={item.file_url}
            target="_blank"
            rel="noreferrer"
            className="theme-admin-button-secondary rounded-xl px-3 py-2 text-center text-sm transition hover:opacity-95"
          >
            Apri file
          </a>

          <button
            type="button"
            onClick={() => onDelete(item.id, item.media_type)}
            disabled={isDeleting}
            className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 transition hover:bg-red-500/15 disabled:opacity-50 dark:text-red-300"
          >
            {isDeleting ? 'Eliminazione...' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  )
}