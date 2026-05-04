'use client'

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react'

type NewsDropZoneProps = {
  title: string
  subtitle: string
  accept: string
  file: File | null
  variant: 'pdf' | 'image'
  onFileChange: (file: File | null) => void
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function NewsDropZone({
  title,
  subtitle,
  accept,
  file,
  variant,
  onFileChange,
}: NewsDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file || variant !== 'image') {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file, variant])

  const openPicker = () => {
    inputRef.current?.click()
  }

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0]
    if (!selected) return

    if (variant === 'pdf') {
      const isPdf =
        selected.type === 'application/pdf' ||
        selected.name.toLowerCase().endsWith('.pdf')

      if (!isPdf) {
        alert('Carica un file PDF valido.')
        return
      }
    }

    if (variant === 'image' && !selected.type.startsWith('image/')) {
      alert('Carica un file immagine valido.')
      return
    }

    onFileChange(selected)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') openPicker()
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`group min-h-[178px] cursor-pointer rounded-[28px] border px-5 py-5 transition-all duration-200 ${
        isDragging
          ? 'border-[#d7a735] bg-[color:color-mix(in_srgb,var(--site-surface)_78%,#d7a735_22%)] shadow-[0_18px_40px_rgba(120,82,20,0.16)]'
          : 'border-[var(--site-border)] bg-[var(--site-surface)] hover:-translate-y-[1px] hover:border-[#d7a735] hover:bg-[color:color-mix(in_srgb,var(--site-surface)_88%,#d7a735_12%)] hover:shadow-[0_14px_32px_rgba(120,82,20,0.12)]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex h-full flex-col justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[var(--site-text-faint)]">
            {title}
          </p>

          <h4 className="mt-3 text-lg font-semibold text-[var(--site-text)]">
            {subtitle}
          </h4>

          <p className="mt-2 text-sm leading-6 text-[var(--site-text-muted)]">
            Trascina qui il file oppure clicca per selezionarlo.
          </p>
        </div>

        {file ? (
          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg-soft)] p-3">
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-14 w-14 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-surface-2)] text-xs font-semibold text-[var(--site-text-muted)]">
                  PDF
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--site-text)]">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-[var(--site-text-muted)]">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onFileChange(null)
                  if (inputRef.current) inputRef.current.value = ''
                }}
                className="rounded-full border border-[var(--site-border)] px-3 py-1 text-xs font-semibold text-[var(--site-text)] transition hover:border-[#d7a735] hover:bg-[color:color-mix(in_srgb,var(--site-surface)_86%,#d7a735_14%)]"
              >
                Rimuovi
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--site-border)] px-4 py-3 text-sm text-[var(--site-text-muted)] transition group-hover:border-[#d7a735]">
            Nessun file selezionato
          </div>
        )}
      </div>
    </div>
  )
}
