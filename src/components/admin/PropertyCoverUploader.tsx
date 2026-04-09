'use client'

import { ChangeEvent, DragEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type PropertyCoverUploaderProps = {
  propertyId: string
  initialCover: string | null
}

export default function PropertyCoverUploader({
  propertyId,
  initialCover,
}: PropertyCoverUploaderProps) {
  const supabase = createClient()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [coverUrl, setCoverUrl] = useState<string | null>(initialCover)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)

  const uploadCover = async (file: File) => {
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `cover-${Date.now()}-${Math.random()
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

    const file = files[0]

    if (!file.type.startsWith('image/')) {
      alert('Carica un file immagine valido.')
      return
    }

    try {
      setIsUploading(true)

      const publicUrl = await uploadCover(file)

      const { error } = await supabase
        .from('properties')
        .update({ main_image: publicUrl })
        .eq('id', propertyId)

      if (error) throw error

      setCoverUrl(publicUrl)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Errore durante il caricamento della copertina.')
    } finally {
      setIsUploading(false)
      setIsDragActive(false)
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

  const removeCover = async () => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ main_image: null })
        .eq('id', propertyId)

      if (error) throw error

      setCoverUrl(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Errore durante la rimozione della copertina.')
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.2em] text-white/40">
          Copertina immobile
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">
          Immagine principale
        </h3>
        <p className="mt-2 text-sm text-white/60">
          Trascina qui la foto di copertina oppure clicca per caricarla.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
        className={`cursor-pointer rounded-3xl border border-dashed p-4 transition ${
          isDragActive
            ? 'border-white/40 bg-white/10'
            : 'border-white/15 bg-black/20'
        }`}
      >
        {coverUrl ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <div
                className="min-h-[320px] bg-cover bg-center"
                style={{ backgroundImage: `url('${coverUrl}')` }}
              />

              {isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-sm">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <p className="mt-4 text-sm font-medium text-white">
                    Aggiornamento copertina...
                  </p>
                  <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-white" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isUploading) inputRef.current?.click()
                }}
                className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black"
              >
                Sostituisci copertina
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isUploading) removeCover()
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
              >
                Rimuovi
              </button>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <p className="text-sm uppercase tracking-[0.18em] text-white/35">
                Spazio copertina
              </p>

              <p className="mt-3 text-sm text-white/60">
                {isUploading
                  ? 'Caricamento copertina...'
                  : 'Trascina qui un’immagine oppure clicca per selezionarla'}
              </p>
            </div>

            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <p className="mt-4 text-sm font-medium text-white">
                  Caricamento copertina...
                </p>
                <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-white" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}