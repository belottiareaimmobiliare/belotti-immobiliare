'use client'

import { useState } from 'react'
import PropertyGalleryLightbox from '@/components/public/PropertyGalleryLightbox'

type GalleryImage = {
  id: string
  file_url: string
  label: string | null
  is_cover: boolean | null
}

type Props = {
  images: GalleryImage[]
}

export default function PropertyGalleryClient({ images }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const openLightbox = (index: number) => {
    setActiveIndex(index)
    setLightboxOpen(true)
  }

  const cover = images.find((item) => item.is_cover) || images[0] || null
  const coverIndex = cover ? images.findIndex((img) => img.id === cover.id) : 0
  const previewThumbnails = images
    .filter((image) => image.id !== cover?.id)
    .slice(0, 3)
  const remainingImagesCount = Math.max(images.length - 4, 0)

  return (
    <>
      {images.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <button
            type="button"
            onClick={() => openLightbox(coverIndex >= 0 ? coverIndex : 0)}
            className="min-h-[420px] rounded-[34px] border border-white/10 bg-cover bg-center text-left transition hover:opacity-95"
            style={
              cover ? { backgroundImage: `url('${cover.file_url}')` } : undefined
            }
          />

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {previewThumbnails.map((image, thumbnailIndex) => {
              const imageIndex = images.findIndex((img) => img.id === image.id)
              const showRemainingOverlay =
                remainingImagesCount > 0 &&
                thumbnailIndex === previewThumbnails.length - 1

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => openLightbox(imageIndex >= 0 ? imageIndex : 0)}
                  className="relative min-h-[130px] overflow-hidden rounded-[28px] border border-white/10 bg-cover bg-center text-left transition hover:opacity-95"
                  style={{
                    backgroundImage: showRemainingOverlay
                      ? `linear-gradient(rgba(0, 0, 0, 0.68), rgba(0, 0, 0, 0.68)), url('${image.file_url}')`
                      : `url('${image.file_url}')`,
                  }}
                  aria-label={
                    showRemainingOverlay
                      ? `Apri galleria: altre ${remainingImagesCount} immagini`
                      : 'Apri immagine immobile'
                  }
                >
                  {showRemainingOverlay ? (
                    <span className="absolute inset-0 flex items-center justify-center text-4xl font-semibold tracking-[-0.04em] text-white drop-shadow-2xl">
                      +{remainingImagesCount}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[420px] items-center justify-center rounded-[34px] border border-dashed border-white/15 bg-white/[0.03] text-white/40">
          Nessuna immagine disponibile
        </div>
      )}

      <PropertyGalleryLightbox
        images={images.map((image) => ({
          src: image.file_url,
          alt: image.label || 'Immagine immobile',
        }))}
        isOpen={lightboxOpen}
        initialIndex={activeIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}