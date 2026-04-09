'use client'

import { ChangeEvent, DragEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type PropertyPlanUploaderProps = {
  propertyId: string
  initialPlan: string | null
}

export default function PropertyPlanUploader({
  propertyId,
  initialPlan,
}: PropertyPlanUploaderProps) {
  const supabase = createClient()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [planUrl, setPlanUrl] = useState<string | null>(initialPlan)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)

  const uploadPlan = async (file: File) => {
    const extension = file.name.split('.').pop() || 'pdf'
    const fileName = `plan-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`
    const filePath = `properties/${propertyId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('property-plans')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from('property-plans').getPublicUrl(filePath)
    return data.publicUrl
  }

  const isAllowedFile = (file: File) => {
    return (
      file.type === 'application/pdf' ||
      file.type.startsWith('image/')
    )
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    if (!isAllowedFile(file)) {
      alert('Carica un PDF o un file immagine valido.')
      return
    }

    try {
      setIsUploading(true)

      const publicUrl = await uploadPlan(file)

      const { error } = await supabase
        .from('properties')
        .update({ planimetry: publicUrl })
        .eq('id', propertyId)

      if (error) throw error

      setPlanUrl(publicUrl)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Errore durante il caricamento della planimetria.')
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

  const removePlan = async () => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ planimetry: null })
        .eq('id', propertyId)

      if (error) throw error

      setPlanUrl(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Errore durante la rimozione della planimetria.')
    }
  }

  const isPdf = planUrl?.toLowerCase().includes('.pdf')

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.2em] text-white/40">
          Planimetria
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">
          File planimetria immobile
        </h3>
        <p className="mt-2 text-sm text-white/60">
          Trascina qui un PDF o un’immagine della planimetria, oppure clicca per caricarla.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
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
        {planUrl ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
              <p className="text-sm text-white/75">
                {isPdf ? 'PDF planimetria caricato' : 'Immagine planimetria caricata'}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={planUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black"
                >
                  Apri file
                </a>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isUploading) inputRef.current?.click()
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                >
                  Sostituisci
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isUploading) removePlan()
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                >
                  Rimuovi
                </button>
              </div>
            </div>

            {!isPdf && (
              <div
                className="min-h-[280px] rounded-2xl border border-white/10 bg-cover bg-center"
                style={{ backgroundImage: `url('${planUrl}')` }}
              />
            )}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
              <p className="text-sm uppercase tracking-[0.18em] text-white/35">
                Spazio planimetria
              </p>

              <p className="mt-3 text-sm text-white/60">
                {isUploading
                  ? 'Caricamento planimetria...'
                  : 'Trascina qui un PDF o immagine oppure clicca per selezionarlo'}
              </p>
            </div>

            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <p className="mt-4 text-sm font-medium text-white">
                  Caricamento planimetria...
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