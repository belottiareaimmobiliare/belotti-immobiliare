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
            {images
              .filter((image) => image.id !== cover?.id)
              .slice(0, 3)
              .map((image) => {
                const imageIndex = images.findIndex((img) => img.id === image.id)

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => openLightbox(imageIndex >= 0 ? imageIndex : 0)}
                    className="min-h-[130px] rounded-[28px] border border-white/10 bg-cover bg-center text-left transition hover:opacity-95"
                    style={{ backgroundImage: `url('${image.file_url}')` }}
                  />
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