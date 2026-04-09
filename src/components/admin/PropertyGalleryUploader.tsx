'use client'

import { ChangeEvent, DragEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type PropertyGalleryUploaderProps = {
  propertyId: string
  initialGallery: string[] | null
}

export default function PropertyGalleryUploader({
  propertyId,
  initialGallery,
}: PropertyGalleryUploaderProps) {
  const supabase = createClient()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [galleryUrls, setGalleryUrls] = useState<string[]>(initialGallery || [])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const uploadImage = async (file: File) => {
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `gallery-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`
    const filePath = `properties/${propertyId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('property-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('property-media')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    )

    if (validFiles.length === 0) {
      alert('Carica almeno un file immagine valido.')
      return
    }

    try {
      setIsUploading(true)
      setUploadedCount(0)
      setTotalCount(validFiles.length)

      const uploadedUrls: string[] = []

      for (let i = 0; i < validFiles.length; i++) {
        const publicUrl = await uploadImage(validFiles[i])
        uploadedUrls.push(publicUrl)
        setUploadedCount(i + 1)
      }

      const nextGallery = [...galleryUrls, ...uploadedUrls]

      const { error } = await supabase
        .from('properties')
        .update({ gallery: nextGallery })
        .eq('id', propertyId)

      if (error) throw error

      setGalleryUrls(nextGallery)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Errore durante il caricamento della gallery.')
    } finally {
      setIsUploading(false)
      setIsDragActive(false)
      setUploadedCount(0)
      setTotalCount(0)
    }
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    handleFiles(e.dataTransfer.files)
  }

  const removeImage = async (urlToRemove: string) => {
    try {
      const nextGallery = galleryUrls.filter((url) => url !== urlToRemove)

      const { error } = await supabase
        .from('properties')
        .update({ gallery: nextGallery })
        .eq('id', propertyId)

      if (error) throw error

      setGalleryUrls(nextGallery)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Errore durante la rimozione dell’immagine.')
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.2em] text-white/40">
          Gallery immobile
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">
          Foto aggiuntive
        </h3>
        <p className="mt-2 text-sm text-white/60">
          Trascina qui una o più immagini oppure clicca per caricarle.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onInputChange}
      />

      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!isUploading) setIsDragActive(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragActive(false)
        }}
        onDrop={onDrop}
        className={`relative cursor-pointer rounded-3xl border border-dashed p-4 transition ${
          isDragActive
            ? 'border-white/40 bg-white/10'
            : 'border-white/15 bg-black/20'
        }`}
      >
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-6 text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-white/35">
            Spazio gallery
          </p>

          <p className="mt-3 text-sm text-white/60">
            {isUploading
              ? `Caricamento immagini ${uploadedCount}/${totalCount}...`
              : 'Trascina qui le foto oppure clicca per selezionarle'}
          </p>
        </div>

        {isUploading && (
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="mt-4 text-sm font-medium text-white">
              Elaborazione gallery...
            </p>
            <p className="mt-2 text-sm text-white/70">
              {uploadedCount} / {totalCount} foto caricate
            </p>
            <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
              <div className="h-full animate-pulse rounded-full bg-white" />
            </div>
          </div>
        )}
      </div>

      {galleryUrls.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {galleryUrls.map((url, index) => (
            <div
              key={url}
              className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
            >
              <div
                className="relative h-48 bg-cover bg-center"
                style={{ backgroundImage: `url('${url}')` }}
              >
                <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/70">
                  Foto {index + 1}
                </div>
              </div>

              <div className="p-3">
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Rimuovi dalla gallery
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}